package com.example.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import com.example.aidto.AIMessage;
import com.example.aidto.AIRequest;
import com.example.aidto.AIResponse;
import com.example.aidto.tools.AIToolCall;
import com.example.entity.Note;
import com.example.exception.BusinessException;

import lombok.extern.slf4j.Slf4j;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Service
public class AIService {
    private final NoteService noteService;
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    private static final int MAX_ROUND = 5;
    private static final int MAX_ATTEMPTS = 3;

    private static final String KEY_PREFIX = "ai:chat:";
    private final StringRedisTemplate redis;
    private final JsonMapper jsonMapper;

    public AIService(
            @Value("${ai.base-url}") String baseUrl,
            @Value("${ai.api-key}") String apiKey,
            @Value("${ai.model}") String model,
            StringRedisTemplate stringRedisTemplate,
            JsonMapper jsonMapper, NoteService noteService) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.redis = stringRedisTemplate;
        this.jsonMapper = jsonMapper;
        this.noteService = noteService;
    }

    // 将新消息添加到缓存
    private void conversationRedis(String key, String role, String content) {
        String jsonMessage = jsonMapper.writeValueAsString(new AIMessage(role, content));
        redis.opsForList().rightPush(key, jsonMessage);
        redis.opsForList().trim(key, -20, -1);
        redis.expire(key, Duration.ofMinutes(30));
    }

    // ai对话
    public String chat(String userMessage, Long userId) {
        String key = KEY_PREFIX + userId;

        List<String> existing = redis.opsForList().range(key, 0, -1);

        List<AIMessage> messages;
        try {
            messages = new ArrayList<>();
            for (String message : existing) {
                messages.add(jsonMapper.readValue(message, AIMessage.class));
            }
            messages.add(new AIMessage("user", userMessage));
        } catch (JacksonException e) {
            log.warn("反序列化出错", e);
            throw new BusinessException(500, "服务器错误");
        }

        for (int i = 0; i < MAX_ROUND; i++) {
            AIRequest request = new AIRequest(model, messages);
            AIMessage aiMessage = callModel(request);

            // 检查有无工具调用，无工具调用输出ai回复
            if (aiMessage.getTool_calls() == null) {
                String aiResponse = aiMessage.getContent();
                conversationRedis(key, "user", userMessage);
                conversationRedis(key, "assistant", aiResponse);

                return aiResponse;
            }

            // 有调用需求，将ai回复的需求添加到message
            messages.add(aiMessage);

            // 获取回复中的参数，调用请求的方法
            for (AIToolCall aiToolCall : aiMessage.getTool_calls()) {
                JsonNode arguments = jsonMapper.readTree(aiToolCall.getFunction().getArguments()); // 反序列化参数
                Note toolReturned = noteService.getById(arguments.path("id").asLong(0), userId);
                String toolResult = jsonMapper.writeValueAsString(Map.of(
                        "title", toolReturned.getTitle(),
                        "content", toolReturned.getContent())); // 序列化消息

                // 将 tool 调用结果添加到 messages，以便下次 callModel 请求读取
                AIMessage toolMessage = new AIMessage("tool", toolResult);
                toolMessage.setTool_call_id(aiToolCall.getId());
                messages.add(toolMessage);
            }
        }

        throw new BusinessException(500, "工具调用轮数过多");
    }

    // 调用模型，提示词工程在调用前完成
    private AIMessage callModel(AIRequest request) {
        for (int attempt = 1;; attempt++) {
            try {
                AIResponse response = restClient.post()
                        .uri("/chat/completions")
                        .header("Authorization", "Bearer " + apiKey)
                        .body(request)
                        .retrieve()
                        .body(AIResponse.class);

                return response.getChoices().get(0).getMessage();
            } catch (HttpClientErrorException.TooManyRequests e) {
                log.warn("模型访问频繁，第 {} 次重试", attempt);
                if (attempt >= MAX_ATTEMPTS) {
                    throw new BusinessException(429, "模型当前访问量过大，请稍后再试");
                }
                try {
                    Thread.sleep(Duration.ofSeconds(attempt));
                } catch (InterruptedException e1) {
                    Thread.currentThread().interrupt(); // 恢复中断标志
                    throw new BusinessException(500, "请求被中断");
                }
            }
        }
    }
}
