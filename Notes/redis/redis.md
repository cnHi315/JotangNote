# Redis 学习笔记

将 MySQL 中的部分热点数据缓存到 Redis。Redis 把数据存在内存里，全局键空间用哈希表组织，value 根据类型用不同结构。由于内存读写远快于磁盘，能显著提升响应速度，降低 MySQL 查询压力。

---

1. Redis 为什么这么快？
   - 数据在内存读写：纳秒级操作。
   - 单线程处理命令：不用加锁解锁、无线程切换，没有并发问题。
   - IO 多路复用：一个线程用 epoll 同时监听上万个连接。
   - 高效数据结构：每种结构都针对场景优化过。
   - 事件驱动：不浪费 CPU 在空转上。
2. 在 MySQL 中的一行数据以什么样的形式存到 Redis 中作为缓存？
   ① String + JSON：整个对象，最常用。
   ② Hash：字段分开存，可单独改。
   ③ List：存对象列表。
3. 如何使用 Java 操作 Redis？
   - StringRedisTemplate：手动序列化成 JSON。
   - RedisTemplate：配 Jackson 序列化。
   - Spring Cache 注解：简单场景用。

---

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

## 三、缓存的三个经典问题

### 1. 缓存一致性

数据库改了，缓存里还是旧值。

有三种解决方法：

- 先更新数据库，再更新缓存
- 先删缓存，再更新数据库
- 先更新数据库，再删缓存

但前两种顺序乱了会有问题：

```text
A 改库 → B 改库 → B 写缓存 → A 写缓存
缓存里最后留下 A 的旧值
```

第三种删除不怕重复执行，删一次和删两次缓存都会抹去，下次读就会拿新值。

### 2. 缓存穿透

查一个库里不存在的 id。

```text
GET /notes/999999
  ↓
缓存没有 → 查库 → 为空 → 返回 404，也不往缓存里写
  ↓
频繁请求
```

这个 id 不存在，每次都会查数据库，显然会影响性能。

所以选择写个空的占位值进去，让请求直接被 redis 弹回。同时设置短 TTL ，防止后续真的有新建的数据，缓存里还留着不存在的结论。

### 3. 缓存击穿

热点笔记的缓存到期，100 个请求同时到达，此时没有缓存，请求全部查库，显然对数据库有影响。

常见的方法是加分布式锁，缓存没有的时候先设置一把 Redis 锁，抢到的去查库、写缓存、放锁，没抢到的等一小会儿重新读缓存。

```bash
SET lock:note:110 NX EX 10
```

>`NX`：key 不存在才设置，设置成功即抢到锁
>`EX 10`：10 秒后自动删，实际时限需大于方法执行最长时间

Java 中的写法：

```java
redis.opsForValue().setIfAbsent(lockKey, "TRUE", Duration.ofSeconds(10))
```

### 5. 项目里的实现

`NoteService.getById` 原来是缓存注解，注解管不了穿透和击穿的时机，改成了手写。

```java
public Note getById(Long id, Long userId) {
    String key = "note:" + id;

    // 防穿透：命中拒绝记录直接返回
    String denyKey = "note:" + id + ":deny:" + userId;
    if ("NULL".equals(redis.opsForValue().get(denyKey))) {
        throw new BusinessException(404, "资源不存在");
    }

    String cached = redis.opsForValue().get(key);
    if (cached != null) {
        return jsonMapper.readValue(cached, Note.class);
    }

    // 防击穿：抢不到锁就等一会儿重新走一遍
    String lockKey = "note:lock:" + id;
    if (!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(lockKey, "TRUE", Duration.ofSeconds(10)))) {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return getById(id, userId);
    }

    try {
        Note existing = noteMapper.getById(id);
        if (existing == null) {
            redis.opsForValue().set(denyKey, "NULL", Duration.ofMinutes(2));
            throw new BusinessException(404, "资源不存在");
        }
        if (!existing.getIsPublic() && !existing.getUserId().equals(userId)) {
            redis.opsForValue().set(denyKey, "NULL", Duration.ofMinutes(2));
            throw new BusinessException(404, "资源不存在");
        }

        if (existing.getIsPublic()) {
            redis.opsForValue().set(key, jsonMapper.writeValueAsString(existing), Duration.ofMinutes(30));
        }
        return existing;
    } finally {
        redis.delete(lockKey);
    }
}
```
