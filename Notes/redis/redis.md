# redis 学习笔记

redis 通过哈希表将部分数据存于内存中，能显著提升系统响应速度，降低数据库交互压力。

## 一、五种基本结构的基本命令

### 1. String

```bash
SET name "张三" # 设置 key-value
GET name    # 读取
SET count 0 
INCR count  # count 自增，count = 1
INCR count  # count = 2
GET count   # count = 3
```

### 2. Hash

```bash
HSET user:1 name "张三" age 20  # 存入对象
HGET user:1 name    # 获取对象指定属性
HGETALL user:1  # 获取对象全部属性
```

### 3. List

```bash
LPUSH notes "笔记1" "笔记2" "笔记3" # 有序列表
LRANGE notes 0 -1   # 获取列表从第 0 个到倒数第一个
RPOP notes  # 删去第一个 value
LRANGE notes 0 -1   # 返回 "笔记2" "笔记3"
```

### 4. Set

```bash
SADD tags "java" "spring" "java"    # 自动去重
SMEMBERS tags   # tags 中仅 "java" "spring"
```

### 5. Zset

```bash
ZADD rank 100 "张三" 90 "李四" 80 "王五"  # 带分数排行
ZRANGE rank 0 -1 WITHSCORES # 分数顺序输出
```

## 二、 Spring Boot 集成 Redis

### 1. 依赖&配置

在 pom.xml 加依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

application.properties 加配置：

```properties
spring.data.redis.host: localhost
spring.data.redis.port: 6379
spring.data.redis.password: my_password
```

### 2. redis 缓存

>学习的时候看到的很多都是 StringRedisTemplate，并提出 RedisTemplate 的 jdk 序列化问题。然后发现如果 get 很多的话就会重复写多次加缓存的一系列代码，正好前不久才学过 aop ，就想着为什么不用 aop 的思想写 redis 呢？</br>
一查发现 spring 正好提供了缓存相关的注解 @Cacheable ，不过这个还是得自己手写序列化的配置，不过也是值得学习的。这里就写一个 StringRedisTemplate ，项目里的就用注解了。

① StringRedisTemplate 实现 note 的 getById 方法的手动缓存：

```java
// GET：查看指定笔记
public Note getById(Long id) {
    String key = "note:" + id;

    String cached = redis.opsForValue().get(key);
    if (cached != null) {
        return jsonMapper.readValue(cached, Note.class);
    }

    Note existing = noteMapper.getById(id);
    if (existing == null) {
        throw new BusinessException(404, "资源不存在");
    }

    redis.opsForValue().set(key, jsonMapper.writeValueAsString(existing), Duration.ofMinutes(30));
    return existing;
}
```

② Spring Cache 实现 Note 的 getById 方法缓存：

配置类 RedisCacheConfig：

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {

        @Bean
        public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
                RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                                .computePrefixWith(cacheName -> cacheName + ":")    // 默认key格式为 cacheName::key, 此处改为 cacheName:key
                                .entryTtl(Duration.ofMinutes(30))   // 统一设定缓存时间
                                .serializeValuesWith(
                                                RedisSerializationContext.SerializationPair.fromSerializer(
                                                                RedisSerializer.json()));   // 使用 ObjectMapper 进行 json 序列化

                return RedisCacheManager.builder(factory)
                                .cacheDefaults(config)
                                .build();
        }
}

```

getById 方法：

```java
// GET：查看指定笔记
@Cacheable(cacheNames = "note", key = "#id")
public Note getById(Long id) {
    Note existing = noteMapper.getById(id);
    if (existing == null) {
        throw new BusinessException(404, "资源不存在");
    }
    return existing;
}
```

>其实还有种 StringRedisTemplate + aop + 自定义注解的方法，可以自己直接定义缓存策略，不过现在学的已经够用了，等以后有需要再试试。
