package com.example.interceptor;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.example.exception.BusinessException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redis;

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return true; // 未登录，放行给后面的鉴权处理
        }

        String rateKey = "rate:" + userId;

        redis.opsForValue().setIfAbsent(rateKey, "0", Duration.ofMinutes(1));
        Long count = redis.opsForValue().increment(rateKey);

        if (count == 1) {
            redis.expiration(rateKey).expire(Duration.ofMinutes(1));
        }

        if (count > 60) {
            throw new BusinessException(429, "请求过于频繁");
        }

        return true;
    }
}