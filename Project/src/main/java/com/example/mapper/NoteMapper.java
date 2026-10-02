package com.example.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import com.example.entity.Note;

public interface NoteMapper {
    // Select
    Note getById(
            @Param("id") Long id);

    List<Note> queryByKeyword(
            @Param("keyword") String keyword,
            @Param("offset") Integer offset,
            @Param("pagesize") Integer pagesize);

    Long countByKeyword(
            @Param("keyword") String keyword);

    // Delete
    @Delete("delete from note_table where id = #{id}")
    Integer deleteById(Long id);

    // Insert
    Integer insert(Note note);

    // Update
    Integer update(Note note);

    // Change is_public
    @Update("update note_table set is_public = NOT is_public where id = #{id}")
    Integer changePublic(Long id);

}
