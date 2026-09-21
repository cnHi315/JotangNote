package com.example.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.example.entity.Note;

public interface NoteMapper {
    @Select("select * from note_table")
    List<Note> list();

    @Select("select * from note_table where id = #{id}")
    Note getById(Integer id);

    @Delete("delete from note_table where id = #{id}")
    Integer deleteById(Integer id);

    @Insert("INSERT INTO note_table (title,content,created_at,updated_at) VALUES (#{title},#{content},#{createdAt},#{updatedAt}) ")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Integer insert(Note note);

    @Update("update note_table SET title=#{title},content=#{content},updated_at=#{updatedAt} WHERE id = #{id}")
    Integer update(Note note);
}
