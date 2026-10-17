package com.example.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.common.PageBean;
import com.example.entity.Note;
import com.example.exception.BusinessException;
import com.example.mapper.NoteMapper;
import com.example.mq.NoteEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteService {
    private final NoteMapper noteMapper;
    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redis;
    private final JsonMapper jsonMapper;

    // 归属校验
    private Note checkOwner(Long id, Long userId) {
        Note existing = getById(id, userId);
        if (!existing.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作他人的笔记");
        }
        return existing;
    }

    // GET：查看指定笔记
    public Note getById(Long id, Long userId) {
        String key = "note:" + id;

        // 先查拒绝记录，避免缓存穿透
        String denyKey = "note:" + id + ":deny:" + userId;
        if ("NULL".equals(redis.opsForValue().get(denyKey))) {
            throw new BusinessException(404, "资源不存在");
        }

        // 查缓存
        String cached = redis.opsForValue().get(key);
        if (cached != null) {
            return jsonMapper.readValue(cached, Note.class);
        }

        // 加锁，防击穿
        String lockKey = "note:lock:" + id;
        if (!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(lockKey, "TRUE", Duration.ofSeconds(10)))) {
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return getById(id, userId);
        }

        try {
            Note existing = noteMapper.getById(id);
            if (existing == null) {
                redis.opsForValue().set(denyKey, "NULL", Duration.ofMinutes(2));
                throw new BusinessException(404, "资源不存在");
            }
            if (!existing.getIsPublic() && !existing.getUserId().equals(userId)) {
                redis.opsForValue().set(denyKey, "NULL", Duration.ofMinutes(2));
                throw new BusinessException(404, "资源不存在");
            }

            if (existing.getIsPublic()) {
                cached = jsonMapper.writeValueAsString(existing);
                redis.opsForValue().set(key, cached, Duration.ofMinutes(30));
            }

            return existing;
        } finally {
            redis.delete(lockKey);
        }
    }

    // GET：根据关键字查询笔记/查询全部
    @Cacheable(cacheNames = "noteList", key = "'keywordnote:' +#keyword + ':' + #page + ':' + #pagesize")
    public PageBean<Note> queryByKeyword(String keyword, Integer page, Integer pagesize) {
        int offset = (page - 1) * pagesize;
        List<Note> list = noteMapper.queryByKeyword(keyword, offset, pagesize);
        Long total = noteMapper.countByKeyword(keyword);
        return new PageBean<Note>(total, list);
    }

    // DELETE：删除指定笔记
    @Caching(evict = {
            @CacheEvict(cacheNames = "noteList", allEntries = true),
            @CacheEvict(cacheNames = "note", key = "#id")
    })
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(Long id, Long userId) {
        checkOwner(id, userId);

        noteMapper.deleteById(id);

        NoteEvent event = new NoteEvent(UUID.randomUUID().toString(), "note.deleted", id, userId, LocalDateTime.now());
        rabbitTemplate.convertAndSend("jotangnote.events", "note.deleted", event);
    }

    // POST：新建笔记
    @CacheEvict(cacheNames = "noteList", allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public Note create(Note note, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        note.setCreatedAt(now);
        note.setUpdatedAt(now);
        note.setUserId(userId);
        note.setIsPublic(true); // is_public 暂不支持设置，固定为公开

        if (noteMapper.insert(note) <= 0) {
            throw new BusinessException(500, "服务器错误");
        }

        NoteEvent event = new NoteEvent(UUID.randomUUID().toString(), "note.created", note.getId(), userId,
                LocalDateTime.now());
        rabbitTemplate.convertAndSend("jotangnote.events", "note.created", event);

        return note;
    }

    // PUT：更新笔记内容
    @Caching(evict = {
            @CacheEvict(cacheNames = "note", key = "#id"),
            @CacheEvict(cacheNames = "noteList", allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public Note update(Long id, Note note, Long userId) {
        checkOwner(id, userId);

        note.setId(id);
        note.setUpdatedAt(LocalDateTime.now());

        noteMapper.update(note);

        NoteEvent event = new NoteEvent(UUID.randomUUID().toString(), "note.updated", id, userId, LocalDateTime.now());
        rabbitTemplate.convertAndSend("jotangnote.events", "note.updated", event);

        return noteMapper.getById(id);
    }

    // PUT: 更改公开/私密状态
    @Caching(evict = {
            @CacheEvict(cacheNames = "note", key = "#id"),
            @CacheEvict(cacheNames = "noteList", allEntries = true)
    })
    @Transactional(rollbackFor = Exception.class)
    public Note changeIsPublic(Long id, Long userId) {
        checkOwner(id, userId);

        noteMapper.changePublic(id);
        return noteMapper.getById(id);
    }
}
