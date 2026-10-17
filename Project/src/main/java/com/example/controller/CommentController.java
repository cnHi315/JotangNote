package com.example.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.Result;
import com.example.entity.Comment;
import com.example.service.CommentService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notes/{noteId}/comments")
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public Result<List<Comment>> getComments(@PathVariable Long noteId,
            @RequestAttribute("userId") Long userId) {
        List<Comment> comments = commentService.getComments(noteId, userId);
        return Result.success(comments);
    }

    @PostMapping
    public Result<String> create(@PathVariable Long noteId,
            @RequestBody Comment comment,
            @RequestAttribute("userId") Long userId,
            @RequestAttribute("username") String username) {
        String eventId = commentService.create(noteId, comment, userId, username);
        return Result.success(eventId);
    }

    @DeleteMapping("/{id}")
    public Result<String> delete(@PathVariable Long noteId,
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @RequestAttribute("username") String username) {
        String eventId = commentService.delete(id, noteId, userId, username);
        return Result.success(eventId);
    }

}
