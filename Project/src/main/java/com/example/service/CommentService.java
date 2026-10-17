package com.example.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.example.entity.Comment;
import com.example.exception.BusinessException;
import com.example.mapper.CommentMapper;
import com.example.mq.CommentCommand;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentMapper commentMapper;
    private final NoteService noteService;
    private final RabbitTemplate rabbitTemplate;

    public List<Comment> getComments(Long noteId, Long userId) {

        // 校验笔记可见性
        noteService.getById(noteId, userId);

        List<Comment> commentList = commentMapper.getByNoteId(noteId);
        Map<Long, Comment> map = new HashMap<>();
        List<Comment> roots = new ArrayList<>();

        for (Comment comment : commentList) {
            if (comment.getIsDeleted()) {
                comment.setContent(null);
                comment.setUsername(null);
            }
            map.put(comment.getId(), comment);
            if (comment.getParentId() == null) {
                roots.add(comment);
            } else {
                Comment parent = map.get(comment.getParentId());
                if (parent != null) {
                    parent.getChildren().add(comment);
                }
            }
        }

        return roots;
    }

    public String create(Long noteId, Comment comment, Long userId, String username) {

        if (comment.getContent() == null || comment.getContent().isBlank()) {
            throw new BusinessException(400, "评论不能为空");
        }

        // 校验笔记可见性
        noteService.getById(noteId, userId);

        if (comment.getParentId() != null) {
            Comment parent = commentMapper.getById(comment.getParentId());
            if (parent == null || !parent.getNoteId().equals(noteId) || parent.getIsDeleted()) {
                throw new BusinessException(400, "无法回复不存在的评论");
            }
        }

        comment.setNoteId(noteId);
        LocalDateTime now = LocalDateTime.now();
        comment.setCreatedAt(now);
        comment.setUserId(userId);
        comment.setUsername(username);
        CommentCommand command = new CommentCommand(
                UUID.randomUUID().toString(),
                "comment.created",
                comment,
                now,
                userId,
                username);
        rabbitTemplate.convertAndSend("jotangnote.events", "comment.created", command);
        return command.getEventId();
    }

    public String delete(Long id, Long noteId, Long userId, String username) {

        noteService.getById(noteId, userId);

        Comment comment = commentMapper.getById(id);
        if (comment == null)
            throw new BusinessException(404, "资源不存在");
        if (!comment.getNoteId().equals(noteId))
            throw new BusinessException(404, "资源不存在");
        if (!comment.getUserId().equals(userId))
            throw new BusinessException(403, "无法删除他人的评论");

        LocalDateTime now = LocalDateTime.now();
        CommentCommand command = new CommentCommand(
                UUID.randomUUID().toString(),
                "comment.deleted",
                comment,
                now,
                userId,
                username);
        rabbitTemplate.convertAndSend("jotangnote.events", "comment.deleted", command);

        return command.getEventId();
    }
}
