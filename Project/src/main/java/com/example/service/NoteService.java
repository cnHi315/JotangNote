package com.example.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.common.PageBean;
import com.example.entity.Note;
import com.example.mapper.NoteMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NoteService {
    private final NoteMapper noteMapper;

    public NoteService(NoteMapper noteMapper) {
        this.noteMapper = noteMapper;
    }

    public Note getById(Integer id) {
        return noteMapper.getById(id);
    }

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

    public boolean deleteById(Integer id) {
        if (noteMapper.deleteById(id) <= 0) {
            return false;
        }
        log.info("删除笔记, id={}", id);
        return true;
    }

    public Note create(Note note) {
        LocalDateTime now = LocalDateTime.now();
        note.setCreatedAt(now);
        note.setUpdatedAt(now);
        if (noteMapper.insert(note) <= 0) {
            return null;
        }
        log.info("创建笔记 id={}, title={}", note.getId(), note.getTitle());
        return note;
    }

    public Note update(Integer id, Note note) {
        note.setId(id);
        note.setUpdatedAt(LocalDateTime.now());
        if (noteMapper.update(note) <= 0) {
            return null;
        }
        log.info("更改笔记 id={}", note.getId());
        return noteMapper.getById(id);
    }
}
