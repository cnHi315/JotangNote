package com.example.mq;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class NoteEventConsumer {
    @RabbitListener(queues = "q.note.audit")
    public void handle(NoteEvent event) {
        log.info("收到消息事件：{}", event);
    }

}
