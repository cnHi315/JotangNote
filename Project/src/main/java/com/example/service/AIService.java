package com.example.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
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

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(120));
        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();

        this.redis = stringRedisTemplate;
        this.jsonMapper = jsonMapper;
        this.noteService = noteService;
    }

    // 将新消息添加到缓存
    private void conversationRedis(String key, AIMessage aiMessage) {
        String jsonMessage = jsonMapper.writeValueAsString(aiMessage);
        redis.opsForList().rightPush(key, jsonMessage);
        redis.opsForList().trim(key, -20, -1);
        redis.expire(key, Duration.ofMinutes(30));
    }

    // ai对话，保持会话缓存和临时 messages 一致
    public String chat(String userMessage, Long userId) {
        String key = KEY_PREFIX + userId;

        List<String> existing = redis.opsForList().range(key, 0, -1);

        List<AIMessage> messages;
        List<AIMessage> pendings = new ArrayList<>(); // 临时缓存记录，调用成功后同步到缓存
        try {
            messages = new ArrayList<>();
            for (String message : existing) {
                AIMessage pastMessage = jsonMapper.readValue(message, AIMessage.class);
                // 开头可能不是 user 的信息，先进行截取再保留
                if (!messages.isEmpty() || pastMessage.getRole().equals("user")) {
                    messages.add(pastMessage);
                }
            }
            AIMessage userAiMessage = new AIMessage("user", userMessage);
            messages.add(userAiMessage);
            pendings.add(userAiMessage);
        } catch (JacksonException e) {
            log.warn("反序列化出错", e);
            throw new BusinessException(500, "服务器错误");
        }

        for (int i = 0; i < MAX_ROUND; i++) {
            AIRequest request = new AIRequest(model, messages);
            AIMessage aiMessage = callModel(request);

            messages.add(aiMessage);
            pendings.add(aiMessage);

            // 检查有无工具调用，无工具调用，同步缓存后输出ai回复
            if (aiMessage.getTool_calls() == null) {
                for (AIMessage pending : pendings) {
                    conversationRedis(key, pending);
                }
                return aiMessage.getContent();
            }

            // 有调用需求，获取回复中的参数，调用请求的方法
            for (AIToolCall aiToolCall : aiMessage.getTool_calls()) {
                JsonNode arguments = jsonMapper.readTree(aiToolCall.getFunction().getArguments()); // 反序列化参数
                String toolResult;
                try {
                    Note toolReturned = noteService.getById(arguments.path("id").asLong(0), userId);
                    toolResult = jsonMapper.writeValueAsString(Map.of(
                            "title", toolReturned.getTitle(),
                            "content", toolReturned.getContent()));
                } catch (BusinessException e) {
                    toolResult = jsonMapper.writeValueAsString(Map.of("error", e.getMessage()));
                }

                // 将 tool 调用结果添加到 messages，以便下次 callModel 请求读取
                AIMessage toolMessage = new AIMessage("tool", toolResult);
                toolMessage.setTool_call_id(aiToolCall.getId());
                messages.add(toolMessage);
                pendings.add(toolMessage);
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
            } catch (ResourceAccessException | HttpServerErrorException e) {
                log.warn("调用模型失败：{}", e.getMessage());
                throw new BusinessException(503, "模型服务暂时不可用，请稍后再试");
            }
        }
    }
}
