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
public class NoteEventConsumer {

    private final CommentMapper commentMapper;
    private final StringRedisTemplate redis;

    @RabbitListener(queues = "q.note.audit")
    public void handle(NoteEvent event) {
        String eventKey = "mq:event:" + event.getEventId();
        if ("TRUE".equals(redis.opsForValue().get(eventKey))) {
            log.info("跳过重复信息: eventId={}", event.getEventId());
            return;
        }

        log.info("收到笔记消息事件：{}", event);
        switch (event.getEventType()) {
            case "note.deleted":
                commentMapper.softDeleteByNoteId(event.getNoteId());
                log.info("评论级联软删处理 笔记id={}", event.getNoteId());
                break;
            case "note.created":
                break;
            case "note.updated":
                break;
            default:
                log.warn("未知评论命令: 用户id={}, eventId={}, 未知消息={}",
                        event.getUserId(),
                        event.getEventId(),
                        event.getEventType());
                return;
        }

        redis.opsForValue().set(eventKey, "TRUE", Duration.ofMinutes(30));

        log.info("处理笔记消息完成: 用户id={}, eventId={}, type={}",
                event.getUserId(),
                event.getEventId(),
                event.getEventType());
    }

}
