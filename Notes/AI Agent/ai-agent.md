# AI Agent 笔记

大模型对外是一个 HTTP 接口，发一个 JSON 过去，返回一个 JSON。AI 助手是围绕这个接口做的一层封装：会话上下文、工具调用、失败重试，可以引用封装好的 SDK，也可以用 RestClient 手写 HTTP。

---

1. Agent 怎么让大模型做更多事？
   ① 把工具定义发给大模型，包括名称、说明和参数的 JSON Schema。
   ② 大模型决定调用哪个工具，返回 tool_calls 和参数。
   ③ 代码解析参数、执行工具，把结果回传。
   ④ 大模型根据结果组织出最终的自然语言回复。
   大模型只负责决定，执行在代码里。参数是 JSON 字符串，要自己解析，也要当不可信输入处理。
2. 长期使用 Agent，信息怎么存？
   ① 滑动窗口：最近几条保留原文，存 Redis。最简单，但超出窗口的直接丢掉。
   ② 摘要压缩：旧消息压缩成摘要，存 MySQL 或 Redis。更完整，但摘要会损失细节。
   ③ 向量检索：所有消息转向量库，用 RAG 检索。适合知识库，但要额外维护一套向量库。
   发给大模型时，拼成摘要 + 最近原文 + 检索结果。

---

## 基本概念

### 1. 请求与响应

请求里主要两个字段：

```json
{
    "model": "glm-4.7-flash",
    "messages": [
        {"role": "user", "content": "你好"}
    ]
}
```

响应里回复在 choices[0].message.content ：

```json
{
    "choices": [
        {"message": {"role": "assistant", "content": "你好"}}
    ]
}
```

不需要 SDK，用 RestClient 发 POST 就能调。

messages 是数组，每条消息有一个 role ：

- system 系统提示词，相当于给模型的设定
- user 用户说的话
- assistant 模型说过的话

### 2. 无状态与会话

调接口是无状态的，每次请求互相独立，模型不记得上一句。

要让它记得，只能把之前的对话一起发过去：

```json
{
    "messages": [
        {"role": "user", "content": "我叫小明"},
        {"role": "assistant", "content": "你好小明"},
        {"role": "user", "content": "我叫什么？"}
    ]
}
```

历史越长 token 越多，也越贵，所以要截断。

### 3. 工具调用

模型不能直接查数据库，只会提出要调用哪个函数，真正执行还得自己写。

一次工具调用要两轮请求：

```text
第一轮
  发：用户问题 + 可用函数列表
  收：模型要求调用 getNoteById，参数 id=3
        ↓ 程序执行，拿到笔记内容
第二轮
  发：原对话 + 模型的要求 + 函数返回结果
  收：模型据此组织自然语言回答
```

两个容易踩的地方：

- 模型返回的参数 arguments 是 JSON 字符串，不是对象，要自己解析
- 回传结果的消息 role 是 tool ，还要带 tool_call_id 指明对应哪次调用

## Spring Boot 集成

### 1. 依赖&配置

不需要额外依赖，RestClient 是 spring-web 自带的。

```properties
ai.api-key=${JOTANGNOTE_API_KEY:}
ai.base-url=https://open.bigmodel.cn/api/paas/v4
ai.model=glm-4.7-flash
```

key 从环境变量读，不写死在代码里。

### 2. 调用模型

RestClient 构造时指定 baseUrl ，key 放在请求头：

```java
this.restClient = RestClient.builder().baseUrl(baseUrl).build();
```

```java
AIResponse response = restClient.post()
        .uri("/chat/completions")
        .header("Authorization", "Bearer " + apiKey)
        .body(request)
        .retrieve()
        .body(AIResponse.class);
```

Bearer 和 key 之间有一个空格，少写会 401 。

响应 DTO 只写用得到的字段：

```java
public class AIResponse {
    private List<Choice> choices;

    public static class Choice {
        private AIMessage message;
    }
}
```

glm 默认先输出一段思考过程再给答案，慢且费 token ，请求里带上这个字段能关掉：

```json
{"thinking": {"type": "disabled"}}
```

实测 completion token 从 151 降到 2 ，耗时从 2588ms 降到 504ms 。

### 3. 会话上下文

会话按用户存在 Redis 的 List 里，key 是 ai:chat:{userId} 。

每轮结束把用户消息和模型回复都追加进去：

```java
private void conversationRedis(String key, String role, String content) {
    String jsonMessage = jsonMapper.writeValueAsString(new AIMessage(role, content));
    redis.opsForList().rightPush(key, jsonMessage);
    redis.opsForList().trim(key, -20, -1);
    redis.expire(key, Duration.ofMinutes(30));
}
```

rightPush 从右边追加，range(key, 0, -1) 从左边开始取，顺序对得上。

trim(key, -20, -1) 只留最后 20 条，防止历史一直涨。

expire 设 30 分钟，用户不说话了自动清掉。

>用 List 是因为对话先进先出，天然对口。缺点是每轮都要全量读出来再全量发过去，对话长了有点浪费。

### 4. 工具调用

函数定义按 JSON Schema 写，放在静态列表里，每次请求一起发过去：

```java
Map.of(
        "type", "object",
        "properties", Map.of(
                "id", Map.of("type", "integer", "description", "笔记ID")),
        "required", List.of("id"))
```

name 和 description 是给模型看的，靠这两项判断什么时候该调、传什么参数。

处理用一个循环，最多 5 轮：

```java
for (int i = 0; i < MAX_ROUND; i++) {
    AIMessage aiMessage = callModel(new AIRequest(model, messages));

    // 没有工具调用，说明这轮是最终回答
    if (aiMessage.getTool_calls() == null) {
        return aiMessage.getContent();
    }

    messages.add(aiMessage);
    for (AIToolCall toolCall : aiMessage.getTool_calls()) {
        // 解析参数、执行、把结果作为 role=tool 的消息加回 messages
    }
}
```

结束的依据是 tool_calls 是不是空。上限 5 轮是兜底，防止模型一直要求调工具。

参数列表里没有 userId ，身份从会话里取。让模型自己传 userId 的话，它就能查别人的笔记。

>模型给的参数当不可信输入处理。

### 5. 429 重试

访问量大时会返回 429，业务码 1305，提示该模型当前访问量过大。这是对面限流，不是自己代码的问题。

这种一般是临时的，等一下重试通常就好：

```java
for (int attempt = 1;; attempt++) {
    try {
        // 调用模型
    } catch (HttpClientErrorException.TooManyRequests e) {
        if (attempt >= MAX_ATTEMPTS) {
            throw new BusinessException(429, "模型当前访问量过大，请稍后再试");
        }
        Thread.sleep(Duration.ofSeconds(attempt));
    }
}
```

等待时间递增（1 秒、2 秒），给对面恢复时间，也免得一直打过去。

重试 3 次还是失败就抛出去，前端提示用户稍后再试。

> 429 也有可能是别的原因，如果频繁 429 可能需要通过业务码确认具体原因。
