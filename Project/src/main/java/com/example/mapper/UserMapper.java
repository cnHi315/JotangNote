package com.example.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.example.entity.Note;
import com.example.entity.User;

public interface UserMapper {
    @Select("select * from users where username = #{username}")
    User getByUsername(String username);

    @Insert("INSERT INTO users (username,password,created_at) VALUES (#{username},#{password},#{createdAt}) ")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Integer insert(User user);

    List<Note> queryByUserId(
            @Param("currentUser") Long currentUser,
            @Param("userId") Long userId,
            @Param("offset") Integer offset,
            @Param("pagesize") Integer pagesize);

    Long countByUserId(
            @Param("currentUser") Long currentUser,
            @Param("userId") Long userId);
}