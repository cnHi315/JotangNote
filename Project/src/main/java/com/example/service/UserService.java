package com.example.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.entity.User;
import com.example.mapper.UserMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserService {
    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    private final PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    public User getByUsername(String username) {
        return userMapper.getByUsername(username);
    }

    public User create(User user) {
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setPassword(encoder.encode(user.getPassword())); // 将密码加密后存入数据库
        if (userMapper.insert(user) <= 0) {
            return null;
        }
        user.setPassword(null); // 抹去 hash
        log.info("新用户注册, username={}", user.getUsername());
        return user;
    }

    public User login(User user) {
        String username = user.getUsername();
        String PWD = user.getPassword();
        User userMatched = userMapper.getByUsername(username);
        if (userMatched == null) {
            return null;
        }
        String PWDMatched = userMatched.getPassword();
        if (!encoder.matches(PWD, PWDMatched)) {
            return null;
        }
        user.setPassword(null);
        return userMatched;
    }
}
