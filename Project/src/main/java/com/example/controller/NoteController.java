package com.example.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.annotation.Log;
import com.example.common.PageBean;
import com.example.common.Result;
import com.example.entity.Note;
import com.example.service.NoteService;

import lombok.RequiredArgsConstructor;

@RestController
// 笔记请求
@RequestMapping("/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping("/{id}")
    public Result<Note> selectById(@PathVariable Long id) {
        Note note = noteService.getById(id);
        return Result.success(note);
    }

    @GetMapping
    public Result<PageBean<Note>> queryByKeyword(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pagesize) {
        // 参数合理化
        page = (page < 1 ? 1 : page);
        pagesize = (pagesize > 100 ? 100 : pagesize);
        pagesize = (pagesize < 1 ? 10 : pagesize);

        PageBean<Note> pageBean = noteService.queryByKeyword(keyword, page, pagesize);
        return Result.success(pageBean);
    }

    @Log("删除指定笔记")
    @DeleteMapping("/{id}")
    public Result<Void> deleteById(@PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        noteService.deleteById(id, userId);
        return Result.success();
    }

    @Log("新建笔记")
    @PostMapping
    public Result<Note> create(@RequestBody Note note,
            @RequestAttribute("userId") Long userId) {
        Note created = noteService.create(note, userId);
        return Result.success(created);
    }

    @Log("更新笔记内容")
    @PutMapping("/{id}")
    public Result<Note> update(@PathVariable Long id,
            @RequestBody Note note,
            @RequestAttribute("userId") Long userId) {
        Note updated = noteService.update(id, note, userId);
        return Result.success(updated);
    }
}
