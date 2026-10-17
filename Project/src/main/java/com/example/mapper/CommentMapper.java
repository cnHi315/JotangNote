package com.example.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.example.entity.Comment;

public interface CommentMapper {

    @Select("select * from comment_table where id = #{id}")
    Comment getById(Long id);

    List<Comment> getByNoteId(Long noteId);

    @Update("update comment_table set is_deleted = 1 where id = #{id}")
    Integer softDelete(Long id);

    @Update("update comment_table set note_is_deleted = 1 where note_id = #{noteId}")
    Integer softDeleteByNoteId(Long noteId);

    Integer insert(Comment comment);

}
