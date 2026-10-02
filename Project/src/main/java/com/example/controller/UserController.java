package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.annotation.Log;
import com.example.common.PageBean;
import com.example.common.Result;
import com.example.entity.Note;
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

    @Log("查看用户笔记")
    @GetMapping("/{userId}/notes")
    public Result<PageBean<Note>> selectUserNotes(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pagesize,
            @RequestAttribute("userId") Long currentUser) {
        page = (page < 1 ? 1 : page);
        pagesize = (pagesize > 100 ? 100 : pagesize);
        pagesize = (pagesize < 1 ? 10 : pagesize);

        PageBean<Note> pageBean = userService.queryUserNotes(page, pagesize, userId, currentUser);
        return Result.success(pageBean);
    }

    @Log("查看个人笔记")
    @GetMapping("/mynotes")
    public Result<PageBean<Note>> selectOwnNotes(
            @RequestAttribute("userId") Long userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pagesize) {
        page = (page < 1 ? 1 : page);
        pagesize = (pagesize > 100 ? 100 : pagesize);
        pagesize = (pagesize < 1 ? 10 : pagesize);

        PageBean<Note> pageBean = userService.queryUserNotes(page, pagesize, userId, userId);
        return Result.success(pageBean);
    }
}