package com.example.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.common.PageBean;
import com.example.entity.Note;
import com.example.exception.BusinessException;
import com.example.mapper.NoteMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoteService {
    private final NoteMapper noteMapper;

    private Note checkOwner(Long id, Long userId) {
        Note existing = noteMapper.getById(id);
        if (existing == null) {
            throw new BusinessException(404, "资源不存在");
        }
        if (!existing.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作他人的笔记");
        }
        return existing;
    }

    // GET：查看指定笔记
    public Note getById(Long id) {
        Note existing = noteMapper.getById(id);
        if (existing == null) {
            throw new BusinessException(404, "资源不存在");
        }
        return existing;
    }

    // GET：根据关键字查询笔记/查询全部
    public PageBean<Note> queryByKeyword(String keyword, Integer page, Integer pagesize) {
        if (page < 1)
            page = 1;
        if (pagesize > 100)
            pagesize = 100;
        else if (pagesize < 1)
            pagesize = 10;
        int offset = (page - 1) * pagesize;
        List<Note> list = noteMapper.queryByKeyword(keyword, offset, pagesize);
        Long total = noteMapper.countByKeyword(keyword);
        return new PageBean<Note>(total, list);
    }

    // DELETE：删除指定笔记
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(Long id, Long userId) {
        checkOwner(id, userId);

        noteMapper.deleteById(id);
    }

    // POST：新建笔记
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

        return note;
    }

    // PUT：更新笔记内容
    @Transactional(rollbackFor = Exception.class)
    public Note update(Long id, Note note, Long userId) {
        checkOwner(id, userId);

        note.setId(id);
        note.setUpdatedAt(LocalDateTime.now());

        noteMapper.update(note);
        return noteMapper.getById(id);
    }
}
