package com.example.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.example.entity.User;
import com.example.mapper.UserMapper;

@Service
public class UserService {
    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public User getByusername(String username) {
        return userMapper.getByUsername(username);
    }

    public User create(User user) {
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        if (userMapper.insert(user) > 0) {
            return user;
        }
        return null;
    }
}
