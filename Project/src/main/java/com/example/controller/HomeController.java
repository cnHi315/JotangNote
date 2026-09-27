package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.Result;

@RestController
public class HomeController {
    @GetMapping
    public Result<String> helloWorld() {
        return Result.success("Welcome to JotangNote");
    }
}