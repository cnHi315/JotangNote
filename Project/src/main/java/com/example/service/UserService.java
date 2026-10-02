package com.example.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.common.PageBean;
import com.example.entity.Note;
import com.example.entity.User;
import com.example.exception.BusinessException;
import com.example.mapper.UserMapper;
import com.example.utils.JwtUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    // 用户密码使用argon2加密保存
    private final PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();

    @Transactional(rollbackFor = Exception.class)
    public User create(User user) {
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setPassword(encoder.encode(user.getPassword())); // 将密码加密后存入数据库
        if (userMapper.insert(user) <= 0) {
            throw new BusinessException(500, "服务器错误");
        }

        user.setPassword(null); // 抹去 hash, 避免泄露
        return user;
    }

    public String login(User user) {
        String username = user.getUsername();
        String PWD = user.getPassword();

        // 登录验证
        User userMatched = userMapper.getByUsername(username);
        if (userMatched == null || !encoder.matches(PWD, userMatched.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        // 登录成功，生成 jwt 令牌
        log.info("登录成功, username={}", user.getUsername());
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userMatched.getId());
        claims.put("username", userMatched.getUsername());
        String jwt = jwtUtils.generateJWT(claims);
        return jwt;
    }

    // GET: 查看用户笔记
    @Cacheable(cacheNames = "noteList", key = "'usernote:' + #pagesize + ':' + #page + ':' + #userId", condition = "#userId != #currentUser")
    public PageBean<Note> queryUserNotes(Integer page, Integer pagesize, Long userId, Long currentUser) {
        int offset = (page - 1) * pagesize;
        List<Note> list = userMapper.queryByUserId(currentUser, userId, offset, pagesize);
        Long total = userMapper.countByUserId(currentUser, userId);
        return new PageBean<Note>(total, list);
    }

}
