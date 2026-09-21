package com.example.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.entity.Note;
import com.example.mapper.NoteMapper;

@Service
public class NoteService {
    private final NoteMapper noteMapper;

    public NoteService(NoteMapper noteMapper) {
        this.noteMapper = noteMapper;
    }

    public List<Note> list() {
        return noteMapper.list();
    }

    public Note getById(Integer id) {
        return noteMapper.getById(id);
    }

    public Integer deleteById(Integer id) {
        return noteMapper.deleteById(id);
    }

    public Note create(Note note) {
        LocalDateTime now = LocalDateTime.now();
        note.setCreatedAt(now);
        note.setUpdatedAt(now);
        if (noteMapper.insert(note) > 0) {
            return note;
        }
        return null;
    }

    public Note update(Integer id, Note note) {
        note.setId(id);
        note.setUpdatedAt(LocalDateTime.now());
        if (noteMapper.update(note) > 0) {
            note = noteMapper.getById(id);
            return note;
        }
        return null;
    }
}
