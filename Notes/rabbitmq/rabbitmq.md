# RabbitMQ 笔记

---

1. 什么情况用 MQ？
   - 异步：耗时任务不阻塞主流程。
   - 解耦：生产者不依赖消费者。
   - 削峰：流量高峰先排队。
   - 最终一致：分布式事务的替代。
   此外还有广播通知、延迟任务、日志收集、数据同步。
2. Java 怎么操作 RabbitMQ？
   ① 加 spring-boot-starter-amqp，配连接信息。
   ② 发消息用 RabbitTemplate.convertAndSend。
   ③ 收消息用 @RabbitListener。
   ④ 队列和绑定写在配置类，也可以用 @QueueBinding 注解。

---

## 1. 同步调用与异步调用

MQ的核心机制就是将原来相关联的一系列客户端请求进行异步处理，使主流程不会因耗时长的操作阻塞，用户能更快收到反馈。

异步也带来了解耦、削峰和最终一致这三个效果。

区分一个操作用同步还是异步一般考虑三点：

- 这个操作必须立刻返回结果吗？
    ├── 是 → 同步
    └── 否
        ↓
- 这个操作失败会影响主流程吗？
    ├── 是 → 同步
    └── 否
        ↓
- 这个操作耗时长吗？
    ├── 否 → 同步也行
    └── 是 → 异步

同步**简单、直观、事务好控制、结果立刻返回**；但**阻塞、吞吐低、响应慢**。  
异步**不阻塞、吞吐高、解耦、容错好**；但**复杂、调试难、一致性难、消息可能丢**。

通常来说，登录、注册、查询、支付等**必须立刻返回结果的用同步**，日志、邮件、统计、AI 分析等**不必须立刻返回的用异步**。

## 2. 技术选型

>现在只学 RabbitMQ ，这里就不写了，像 jotongNote 这种比较轻量且处于学习阶段的可以先用 RabbitMQ。除此之外常见的还有 ActiveMQ , RocketMQ , Kafka（吞吐量最大，日志、流处理、大数据常见）。

## 3. 整体架构

- publisher: 消息发送者
    ↓
- exchange: 交换机，负责路由消息
    ↓（binding: 交换规则）
- queue: 队列，存储消息
    ↓
- consumer: 消息消费者

中间的 exchange 和 queue 两部分则是 MQ 负责的部分，会用虚拟主机（VirtualHost）将中间两层的数据隔离起来。

## 4. 四种交换机

### ① Drecit Exchange (直连交换机)

仅当消息的 routing key 和队列的 binding key 完全匹配时路由。

```text
routing key = "note.created" ← 生产者
        ↓
Direct Exchange
        ↓ 精确匹配
队列 A（binding key = "note.created"）← 收到
队列 B（binding key = "note.updated"）← 收不到
```

适用于点对点精确路由，一个消息只给特定的队列。比如订单创建、订单取消这类。

### ② Fanout Exchange (扇出交换机)

忽略 routing key，消息广播给所有绑定的队列。

```text
生产者 → Fanout Exchange
              ↓ 广播给所有
    +—————————+—————————+
    ↓         ↓         ↓
队列A       队列B      队列C
    ↓         ↓         ↓
  收到      收到      收到
```

适用于广播通知，一个事件，多个系统都要处理。比如创建笔记后，邮件、日志、统计、搜索等全都收到。

### ③ Topic Exchange (主题交换机)

routing key 按 . 分割，支持通配符匹配。

- `*`：匹配一个单词。

- `#`：匹配零个或多个单词。

```text
生产者 → routing key = "note.created.java"
              ↓
        Topic Exchange
    +—————————+—————————+
    ↓         ↓         ↓
队列A       队列B      队列C
(note.created.*) (note.#) (note.updated.*)
    ↓         ↓         ↓
  收到      收到      收不到
```

适用于灵活路由，一个消息按不同维度分发给不同队列。比如按模块、按操作类型、按语言分类的情况。

### ④ Headers Exchange (头交换机)

不看 routing key，看消息头（headers）匹配。绑定的时候指定一组 header 键值对，消息的 header 满足条件才路由。

```text
消息 header: { type: "note", format: "json" }
    ↓
队列A（binding: type=note）           ← 收到
队列B（binding: type=note, format=xml）← 收不到（format 不匹配）
队列C（binding: type=user）            ← 收不到
```

适用于按消息属性路由，不依赖 routing key，或者条件复杂，routing key 表达不了的情况。

实际项目很少用，Topic 基本能替代。

## 5. Spring Boot 集成

### 依赖与配置

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```properties
spring.rabbitmq.host=127.0.0.1
spring.rabbitmq.port=5672
spring.rabbitmq.username=cnHi
spring.rabbitmq.password=959783
```

### 构件声明

```java
@Configuration
public class RabbitMQConfig {

    @Bean // 交换机声明
    TopicExchange noteExchange() {
        return new TopicExchange("jotangnote.events");
    }

    @Bean // 队列声明
    Queue noteAuditQueue() {
        return new Queue("q.note.audit");
    }

    @Bean // 绑定声明
    Binding noteAuditBinding(Queue noteAuditQueue, TopicExchange noteExchange) {
        return BindingBuilder.bind(noteAuditQueue).to(noteExchange).with("note.#");
    }

    @Bean // 消息转换器声明
    MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
```

`@Bean` 方法参数按类型自动注入，不需要手动 new。

此外 `@RabbitListener` 注解也提供了声明相关的属性，可以不写配置类而使用 `@RabbitListener` 声明。

### 消息转换器

不配置时默认只支持 `String` / `byte[]` / `Serializable`，发 Java 对象会报错。

Spring AMQP 4 的类名是 `JacksonJsonMessageConverter`；旧版本 Jackson 2 使用带 `2` 的 `Jackson2JsonMessageConverter`。

### 生产者

注入 `RabbitTemplate`：

```java
rabbitTemplate.convertAndSend(exchange, routingKey, payload);
```

### 消费者

```java
@RabbitListener(queues = "q.note.audit")
public void handle(NoteEvent event) {
    log.info("收到消息事件：{}", event);
}
```

Spring 维护监听容器，消息到达时在独立线程调用该方法，自动获取推送消息。

### 消息体：DTO

采用事件式，内容是"note.deleted 发生了"，生产者不知道消费者，消费者自己看需不需要关心，新增消费者不用改生产者

```java
@Data
@NoArgsConstructor          // 反序列化需要无参构造
@AllArgsConstructor
public class NoteEvent {
    private String eventType;           // note.created / updated / deleted
    private Long noteId;
    private Long userId;
    private LocalDateTime occurredAt;   // 事件发生的时间
}
```

routing key 与 `eventType` 保持一致。routing key 供 broker 路由，eventType 供消费者读取。

## 6. 顺序性

MQ 只保证同一个队列、同一个消费者内先进先出。跨队列没有顺序。

会乱的三种情况：

- 一个队列挂多个消费者，各自取一条，谁先处理完不确定
- 消费失败被 nack 重新入队，回到队列尾部，排到后来消息的后面
- 消息超时进死信队列，再被投递回来

保证的办法：

- 单队列单消费者
- 按业务主体分流，同一条数据的消息固定进同一个队列
- 消费端记一个最后处理时间，比它旧的消息丢弃

`q.note.audit` 和 `q.comment.command` 现在都是单消费者，各自队列内部有序。

跨队列依然无序。笔记删除走 `q.note.audit`，评论创建走 `q.comment.command`。笔记行已经删掉、评论创建的消息还压在队列里，消费者处理它时照样能插进去，留下一条挂在已删笔记下的评论。

消费端的兜底校验还没做。

## 7. 幂等性

重复的来源：

- 生产者发出去后没收到 broker 的确认，以为失败，重发
- 消费者处理完，ack 在路上丢了，broker 重投

两次投递的是同一份消息，`eventId` 不变。

消费端开头查一次：

```java
String eventKey = "mq:event:" + command.getEventId();
if ("TRUE".equals(redis.opsForValue().get(eventKey))) {
    log.info("跳过重复信息：eventId={}", command.getEventId());
    return;
}
```

处理成功之后才写这个键，TTL 30 分钟：

```java
redis.opsForValue().set(eventKey, "TRUE", Duration.ofMinutes(30));
```

顺序不能反。写在前面的情况下，insert 失败抛异常、消息重投，回来一看键在就跳过，这条评论永远不落库。

同一条消息连投三次：

```text
第 1 次  处理评论消息完成: eventId=fixed-event-test-001
第 2 次  跳过重复信息：eventId=fixed-event-test-001
第 3 次  跳过重复信息：eventId=fixed-event-test-001
```

库里一条。

换三个 id、内容不变再投：

```text
id=9   id=10   id=11   id=12    四条内容相同的评论
```

去重只认 id，不认内容。

前端点两次发送是两个请求、两个 uuid，挡不住。那一层要靠客户端幂等键，前端生成、重试复用。项目里没做。
