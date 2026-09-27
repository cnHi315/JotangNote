package com.example.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.Result;
import com.example.entity.User;
import com.example.service.UserService;
import com.example.utils.JwtUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final JwtUtils jwtUtils;
    private final UserService userService;

    // 用户操作

    // Post：新建用户
    @PostMapping("/register")
    public Result<User> create(@RequestBody User user) {
        User created = userService.create(user);
        if (created == null) {
            return Result.error(500, "服务器错误");
        }
        return Result.success(user);
    }

    // 用户登录: 返回 jwt 令牌
    @PostMapping("/login")
    public Result<String> login(@RequestBody User user) {
        user = userService.login(user);
        if (user == null) {
            return Result.error(401, "用户名或密码错误");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("name", user.getUsername());
        String jwt = jwtUtils.generateJWT(claims);
        return Result.success(jwt);
    }

}
