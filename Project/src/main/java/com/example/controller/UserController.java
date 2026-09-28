package com.example.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.annotation.Log;
import com.example.common.Result;
import com.example.entity.User;
import com.example.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 用户操作

    // POST: 创建用户
    @Log("用户注册")
    @PostMapping("/register")
    public Result<User> create(@RequestBody User user) {
        userService.create(user);
        return Result.success(user);
    }

    // 用户登录: 返回 jwt 令牌
    @Log("用户登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody User user) {
        String jwt = userService.login(user);
        return Result.success(jwt);
    }

}
