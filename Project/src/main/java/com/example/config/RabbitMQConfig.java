package com.example.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    TopicExchange noteExchange() {
        return new TopicExchange("jotangnote.events");
    }

    // 笔记队列

    @Bean
    Queue noteAuditQueue() {
        return new Queue("q.note.audit");
    }

    @Bean
    Binding noteAuditBinding(Queue noteAuditQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(noteAuditQueue).to(noteExchange).with("note.#");
    }

    // 评论队列

    @Bean
    Queue commentCommandQueue() {
        return new Queue("q.comment.command");
    }

    @Bean
    Binding commentCommandBinding(Queue commentCommandQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(commentCommandQueue).to(noteExchange).with("comment.#");
    }

}
