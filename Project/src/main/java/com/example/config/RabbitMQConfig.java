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
    Queue noteAuditQueue() {
        return new Queue("q.note.audit");
    }

    @Bean
    TopicExchange noteExchange() {
        return new TopicExchange("jotangnote.events");
    }

    @Bean
    Binding noteAuditBinding(Queue noteAuditQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(noteAuditQueue).to(noteExchange).with("note.#");
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

}
