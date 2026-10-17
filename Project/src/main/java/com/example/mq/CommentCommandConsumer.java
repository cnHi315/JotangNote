package com.example.mq;

import java.time.Duration;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.example.mapper.CommentMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CommentCommandConsumer {

    private final CommentMapper commentMapper;
    private final StringRedisTemplate redis;

    @RabbitListener(queues = "q.comment.command")
    public void handle(CommentCommand command) {
        String eventKey = "mq:event:" + command.getEventId();
        if ("TRUE".equals(redis.opsForValue().get(eventKey))) {
            log.info("跳过重复信息: eventId={}", command.getEventId());
            return;
        }

        switch (command.getEventType()) {
            case "comment.created":
                commentMapper.insert(command.getComment());
                break;
            case "comment.deleted":
                commentMapper.softDelete(command.getComment().getId());
                break;
            default:
                log.warn("未知评论命令: 用户id={}, 用户名={}, eventId={}, 未知消息={}",
                        command.getUserId(),
                        command.getUsername(),
                        command.getEventId(),
                        command.getEventType());
                return;
        }

        redis.opsForValue().set(eventKey, "TRUE", Duration.ofMinutes(30));

        log.info("处理评论消息完成: 用户id={}, 用户名={}, eventId={}, type={}",
                command.getComment().getUserId(),
                command.getComment().getUsername(),
                command.getEventId(),
                command.getEventType());
    }
}
