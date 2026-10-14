package com.example.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import com.example.annotation.Log;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Aspect
@Component
public class OperationLogAspect {
    @Around("@annotation(logOperation)")
    public Object recordOperation(ProceedingJoinPoint pjp, Log logOperation) throws Throwable {
        Long userId = 0L;
        String username = "游客";
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            userId = (Long) attrs.getAttribute("userId", RequestAttributes.SCOPE_REQUEST);
            username = (String) attrs.getAttribute("username", RequestAttributes.SCOPE_REQUEST);
            if (userId == null || username == null) {
                userId = 0L;
                username = "游客";
            }
        }

        long begin = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            long cost = System.currentTimeMillis() - begin;
            log.info("[操作] 用户id={} 用户名={} 操作={} 方法={} 耗时={}ms",
                    userId, username, logOperation.value(), pjp.getSignature().toShortString(), cost);
            return result;
        } catch (Exception e) {
            log.warn("[操作] 用户id={} 用户名={} 操作={} 方法={} 异常={}",
                    userId, username, logOperation.value(), pjp.getSignature().toShortString(), e.getMessage());
            throw e;
        }

    }
}
