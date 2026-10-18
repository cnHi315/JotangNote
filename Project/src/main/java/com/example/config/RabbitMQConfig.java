package com.example.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
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
        return QueueBuilder.durable("q.note.audit")
                .deadLetterExchange("jotangnote.dlx")
                .build();
    }

    @Bean
    Binding noteAuditBinding(Queue noteAuditQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(noteAuditQueue).to(noteExchange).with("note.#");
    }

    // 评论队列

    @Bean
    Queue commentCommandQueue() {
        return QueueBuilder.durable("q.comment.command")
                .deadLetterExchange("jotangnote.dlx")
                .build();
    }

    @Bean
    Binding commentCommandBinding(Queue commentCommandQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(commentCommandQueue).to(noteExchange).with("comment.#");
    }

    // 死信队列

    @Bean
    FanoutExchange deadLetterExchange() {
        return new FanoutExchange("jotangnote.dlx");
    }

    @Bean
    Queue deadQueue() {
        return new Queue("q.dead");
    }

    @Bean
    Binding deadBinding(Queue deadQueue, FanoutExchange deadLetterExchange) {
        return BindingBuilder.bind(deadQueue).to(deadLetterExchange);
    }

}
