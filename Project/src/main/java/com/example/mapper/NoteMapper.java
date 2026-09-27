package com.example.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;

import com.example.entity.Note;

public interface NoteMapper {
    // Select
    Note getById(Integer id);

    List<Note> queryByKeyword(
            @Param("keyword") String keyword,
            @Param("offset") Integer offset,
            @Param("pagesize") Integer pagesize);

    Long countByKeyword(String keyword);

    // Delete
    @Delete("delete from note_table where id = #{id}")
    Integer deleteById(Integer id);

    // Insert
    Integer insert(Note note);

    // Update
    Integer update(Note note);
}
