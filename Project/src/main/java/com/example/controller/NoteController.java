package com.example.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.entity.Note;
import com.example.service.NoteService;
import com.example.service.UserService;

@RestController
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService, UserService userService) {
        this.noteService = noteService;
    }

    // 笔记操作
    @GetMapping("/")
    public String helloWorld() {
        return "Welcome to JotangNote";
    }

    // GET：查看全部笔记
    @GetMapping("/notes")
    public List<Note> list() {
        return noteService.list();
    }

    // GET：查看指定笔记
    @GetMapping("/notes/{id}")
    public ResponseEntity<Note> selectById(@PathVariable Integer id) {
        Note note = noteService.getById(id);
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(note);
    }

    // DELETE：删除指定笔记
    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Integer id) {
        if (noteService.deleteById(id) > 0) {
            return ResponseEntity.status(204).build();
        }
        return ResponseEntity.notFound().build();
    }

    // POST：新建笔记
    @PostMapping("/notes")
    public ResponseEntity<Note> create(@RequestBody Note note) {
        Note created = noteService.create(note);
        if (created == null) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.status(201).body(created);
    }

    // PUT：更新笔记内容
    @PutMapping("/notes/{id}")
    public ResponseEntity<Note> update(@PathVariable Integer id, @RequestBody Note note) {
        Note updated = noteService.update(id, note);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(200).body(updated);
    }
}
