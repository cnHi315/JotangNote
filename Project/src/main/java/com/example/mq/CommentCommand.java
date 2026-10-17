package com.example.mq;

import java.time.LocalDateTime;

import com.example.entity.Comment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCommand {
    private String eventId; // UUID，幂等用
    private String eventType; // comment.created / comment.deleted
    private Comment comment;
    private LocalDateTime occurredAt;
    private Long userId;
    private String username;
}
