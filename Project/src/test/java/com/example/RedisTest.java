package com.example;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

@SpringBootTest
class RedisTest {
    // redis test

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Test
    public void test() {
        // 存
        stringRedisTemplate.opsForValue().set("name", "张三");
        stringRedisTemplate.opsForValue().set("count", "100");

        // 取
        String name = stringRedisTemplate.opsForValue().get("name");
        String count = stringRedisTemplate.opsForValue().get("count");

        System.out.println("name = " + name);
        System.out.println("count = " + count);
    }

}
