package com.example.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import com.example.ai.AIMessage;
import com.example.ai.AIRequest;
import com.example.ai.AIResponse;
import com.example.exception.BusinessException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Service
public class AIService {
    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    private static final String KEY_PREFIX = "ai:chat:";
    private final StringRedisTemplate redis;
    private final JsonMapper jsonMapper;

    public AIService(
            @Value("${ai.base-url}") String baseUrl,
            @Value("${ai.api-key}") String apiKey,
            @Value("${ai.model}") String model,
            StringRedisTemplate stringRedisTemplate,
            JsonMapper jsonMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.redis = stringRedisTemplate;
        this.jsonMapper = jsonMapper;
    }

    // 将新消息添加到缓存
    private void conversationRedis(String key, String role, String content) {
        String jsonMessage = jsonMapper.writeValueAsString(new AIMessage(role, content));
        redis.opsForList().rightPush(key, jsonMessage);
        redis.opsForList().trim(key, -20, -1);
        redis.expire(key, Duration.ofMinutes(30));
    }

    // 吉祥物对话
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
            throw new BusinessException(500, "服务器错误");
        }

        AIRequest request = new AIRequest(model, messages);
        String aiResponse = callModel(request);
        conversationRedis(key, "user", userMessage);
        conversationRedis(key, "assistant", aiResponse);

        return aiResponse;
    }

    // 调用模型，提示词工程在调用前完成
    private String callModel(AIRequest request) {
        try {
            AIResponse response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(request)
                    .retrieve()
                    .body(AIResponse.class);

            return response.getChoices().get(0).getMessage().getContent();
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new BusinessException(429, "模型当前访问量过大，请稍后再试");
        }
    }
}
