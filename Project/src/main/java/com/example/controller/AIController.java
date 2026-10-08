package com.example.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.Result;
import com.example.service.AIService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping
    public Result<String> chat(@RequestBody String userMessage,
            @RequestAttribute("userId") Long userId) {
        String response = aiService.chat(userMessage, userId);
        return Result.success(response);
    }
}
