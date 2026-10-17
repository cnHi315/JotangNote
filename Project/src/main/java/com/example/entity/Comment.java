package com.example.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Comment {
    private Long id;
    private Long noteId;
    private Long userId;
    private String username;
    private Long parentId;
    private LocalDateTime createdAt;
    private String content;
    private Boolean isDeleted;
    private Boolean noteIsDeleted;
    private List<Comment> children = new ArrayList<>();
}