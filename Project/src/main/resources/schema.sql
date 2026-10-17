CREATE TABLE IF NOT EXISTS note_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '笔记id',
    title varchar(200) NOT NULL COMMENT '标题',
    content text NOT NULL COMMENT '正文',
    created_at DATETIME NOT NULL COMMENT '创建时间',
    updated_at DATETIME NOT NULL COMMENT '更新时间',
    user_id BIGINT NOT NULL COMMENT '用户id',
    is_public BOOLEAN NOT NULL DEFAULT 1 COMMENT '公开'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT '笔记数据库';

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户id',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码哈希',
    created_at DATETIME NOT NULL COMMENT '注册时间'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT '用户表';

CREATE TABLE IF NOT EXISTS comment_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论id',
    note_id BIGINT NOT NULL COMMENT '笔记id',
    user_id BIGINT NOT NULL COMMENT '用户id',
    username VARCHAR(50) NOT NULL COMMENT '发表时的用户名',
    parent_id BIGINT COMMENT '父节点id',
    content text NOT NULL COMMENT '评论内容',
    created_at DATETIME NOT NULL COMMENT '创建时间',
    is_deleted BOOLEAN NOT NULL DEFAULT 0 COMMENT '删除状态',
    note_is_deleted BOOLEAN NOT NULL DEFAULT 0 COMMENT '笔记删除状态',
    KEY idx_note_id (note_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT '评论表';