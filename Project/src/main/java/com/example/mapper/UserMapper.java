package com.example.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import com.example.entity.User;

public interface UserMapper {
    @Select("select * from users where username = #{username}")
    User getByUsername(String username);

    @Insert("INSERT INTO users (username,password,created_at) VALUES (#{username},#{password},#{createdAt}) ")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Integer insert(User user);
}