package com.example.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.common.PageBean;
import com.example.common.Result;
import com.example.entity.Note;
import com.example.service.NoteService;

@RestController
// 笔记请求
@RequestMapping("/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    // GET：查看指定笔记
    @GetMapping("/{id}")
    public Result<Note> selectById(@PathVariable Integer id) {
        Note note = noteService.getById(id);
        if (note == null) {
            return Result.error(404, "资源不存在");
        }
        return Result.success(note);
    }

    // GET：根据关键字查询笔记/查询全部
    @GetMapping
    public Result<PageBean<Note>> queryByKeyword(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pagesize) {
        PageBean<Note> pageBean = noteService.queryByKeyword(keyword, page, pagesize);
        return Result.success(pageBean);
    }

    // DELETE：删除指定笔记
    @DeleteMapping("/{id}")
    public Result<Void> deleteById(@PathVariable Integer id) {
        if (noteService.deleteById(id)) {
            return Result.success();
        }
        return Result.error(404, "资源不存在");
    }

    // POST：新建笔记
    @PostMapping
    public Result<Note> create(@RequestBody Note note) {
        Note created = noteService.create(note);
        if (created == null) {
            return Result.error(500, "服务器错误");
        }
        return Result.success(created);
    }

    // PUT：更新笔记内容
    @PutMapping("/{id}")
    public Result<Note> update(@PathVariable Integer id, @RequestBody Note note) {
        Note updated = noteService.update(id, note);
        if (updated == null) {
            return Result.error(404, "资源不存在");
        }
        return Result.success(updated);
    }
}
