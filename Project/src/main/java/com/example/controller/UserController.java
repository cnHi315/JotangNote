package com.example.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.entity.User;
import com.example.service.UserService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
public class UserController {

    private UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 用户操作

    // Post：新建用户
    @PostMapping("/register")
    public ResponseEntity<User> create(@RequestBody User user) {
        User created = userService.create(user);
        if (created == null) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.status(201).body(user);
    }

    // 用户登录
    // @PostMapping("/login")
    // public Error login(@RequestBody String entity) {

    // return entity;
    // }

}
