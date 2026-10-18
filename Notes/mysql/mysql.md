# MySQL 笔记

---

1. MySQL 能承载多少数据？
   单表百万到千万，单库亿级，分库分表可以到百亿。
2. 为什么快？
   ① B+ 树索引：O(log n)，减少磁盘 IO。
   ② Buffer Pool：内存缓存热点页，命中就不读磁盘。
   ③ WAL（Write-Ahead Logging）：先写日志，异步刷盘。
   ④ 行级锁 + MVCC：并发读写不冲突。
3. 怎么用 Java 操作？
   - 底层 JDBC，实际用 MyBatis（本项目）或 JPA。
   - Mapper 接口 + @Select / @Insert 注解。
   - Spring 自动注入，Service 调 Mapper。
4. 长文本和图片该存在哪？
   长文本拆到单独的表，搜索量大了交给搜索引擎；图片放对象存储，库里只存 key。

---

## 基本概念

MySQL 是关系型数据库，数据存在磁盘上的表里。

表是二维的，一行是一条记录，一列是一个字段。note_table 里一行就是一篇笔记。

## SQL 基本语句

操作数据库靠 SQL ，按用途分几类：

- DDL 定义结构：CREATE / ALTER / DROP
- DML 改数据：INSERT / UPDATE / DELETE
- DQL 查数据：SELECT
- DCL 管权限：GRANT / REVOKE
- TCL 管事务：COMMIT / ROLLBACK

### 一、库操作

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS jotangnote DEFAULT CHARACTER SET utf8mb4;

-- 查看所有库
SHOW DATABASES;

-- 使用库
USE jotangnote;

-- 删除库（慎用）
DROP DATABASE IF EXISTS jotangnote;
```

### 二、表操作

#### 建表

```sql
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '笔记 ID',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '正文',
    user_id BIGINT COMMENT '发布者 ID',
    created_at DATETIME NOT NULL COMMENT '创建时间',
    updated_at DATETIME NOT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='笔记表';
```

#### 查看表

```sql
SHOW TABLES;                    -- 所有表
DESC notes;                     -- 表结构
SHOW CREATE TABLE notes;        -- 建表语句
```

#### 修改表

```sql
-- 加字段
ALTER TABLE notes ADD COLUMN views INT DEFAULT 0 COMMENT '浏览量';

-- 改字段类型
ALTER TABLE notes MODIFY COLUMN title VARCHAR(300) NOT NULL;

-- 改字段名
ALTER TABLE notes CHANGE COLUMN views view_count INT DEFAULT 0;

-- 删字段
ALTER TABLE notes DROP COLUMN view_count;

-- 加索引
ALTER TABLE notes ADD INDEX idx_user_id (user_id);
```

#### 删表

```sql
DROP TABLE IF EXISTS notes;     -- 删表结构和数据
TRUNCATE TABLE notes;           -- 只清数据，保留结构
```

### 三、增（INSERT）

```sql
-- 插入一条
INSERT INTO notes (title, content, user_id, created_at, updated_at)
VALUES ('第一篇', '今天学了 SQL', 1, NOW(), NOW());

-- 插入多条
INSERT INTO notes (title, content, user_id, created_at, updated_at)
VALUES
('第二篇', '内容 B', 1, NOW(), NOW()),
('第三篇', '内容 C', 2, NOW(), NOW());
```

### 四、查（SELECT）

```sql
-- 查所有
SELECT * FROM notes;

-- 查指定列
SELECT id, title FROM notes;

-- 条件查询
SELECT * FROM notes WHERE id = 1;
SELECT * FROM notes WHERE user_id = 1;
SELECT * FROM notes WHERE title LIKE '%SQL%';

-- 排序
SELECT * FROM notes ORDER BY created_at DESC;

-- 分页
SELECT * FROM notes LIMIT 10 OFFSET 0;   -- 第 1 页，每页 10 条
SELECT * FROM notes LIMIT 10 OFFSET 10;  -- 第 2 页

-- 统计
SELECT COUNT(*) FROM notes;
SELECT COUNT(*) FROM notes WHERE user_id = 1;

-- 去重
SELECT DISTINCT user_id FROM notes;

-- 聚合
SELECT user_id, COUNT(*) AS note_count
FROM notes
GROUP BY user_id
HAVING note_count > 1;
```

### 五、改（UPDATE）

```sql
UPDATE notes
SET title = '改过了', updated_at = NOW()
WHERE id = 1;
```

没有 WHERE 会更新全表，务必小心。

### 六、删（DELETE）

```sql
DELETE FROM notes WHERE id = 1;
```

没有 WHERE 会删光全表数据。

### 七、多表查询（后面加 users 表会用到）

```sql
-- 查笔记和它的发布者
SELECT n.id, n.title, u.username
FROM notes n
JOIN users u ON n.user_id = u.id
WHERE n.id = 1;

-- 左连接：即使没有发布者也显示笔记
SELECT n.id, n.title, u.username
FROM notes n
LEFT JOIN users u ON n.user_id = u.id;
```

### 八、常用函数

```sql
NOW()                    -- 当前时间
CURDATE()                -- 当前日期
COUNT(*)                 -- 计数
SUM(views)               -- 求和
AVG(views)               -- 平均
MAX(views), MIN(views)   -- 最大最小
IFNULL(views, 0)         -- 空值替换
CONCAT(title, ' - ', id) -- 拼接
```

## Spring Boot 集成 MySQL

### 1. 依赖&配置

pom.xml 加依赖：

```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>4.1.0</version>
</dependency>

<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>
```

application.properties 加配置：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jotangnote?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=******
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

mybatis.mapper-locations=classpath:com/example/mapper/*.xml
mybatis.type-aliases-package=com.example.entity
mybatis.configuration.map-underscore-to-camel-case=true
```

url 里 useUnicode 和 characterEncoding 是用来防中文乱码的，serverTimezone 要和数据库实际时区对上，不然读写时间会偏。

mapper 接口不是写在 mapper 包里就能被扫描到的，还要在启动类上写 @MapperScan 指定包：

```java
@MapperScan("com.example.mapper")
@SpringBootApplication
public class DemoApplication { }
```

### 2. 建表：schema.sql 自动执行

```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
```

把建表语句放到 resources/schema.sql ，启动的时候就会自动执行。

里面的建表语句都带了 IF NOT EXISTS ，所以每次启动跑一遍也不会报错，不用自己手动去数据库里建表。

### 3. 两种写 SQL 的方式

SQL 短、没有什么分支的时候用注解式，直接写在接口方法上：

```java
public interface NoteMapper {
    @Delete("delete from note_table where id = #{id}")
    Integer deleteById(Long id);

    @Update("update note_table set is_public = NOT is_public where id = #{id}")
    Integer changePublic(Long id);
}
```

SQL 比较长、或者要拼条件的时候就写在 XML 里，namespace 指向接口全限定名，id 对应方法名：

```xml
<mapper namespace="com.example.mapper.NoteMapper">
    <select id="queryByKeyword" resultType="Note">
        SELECT * FROM note_table
        <include refid="keywordFilter"></include>
        ORDER BY created_at DESC
        LIMIT #{offset}, #{pagesize}
    </select>
</mapper>
```

resultType 这里能直接写 Note 而不是全限定名，是因为配了 mybatis.type-aliases-package 。

### 4. 动态 SQL

条件不确定的时候不用在 Java 里拼字符串，交给标签就行：

```xml
<sql id="keywordFilter">
    <where>
        is_public = 1
        <if test="keyword != null and keyword != ''">
            AND (title LIKE CONCAT('%', #{keyword}, '%')
            OR content LIKE CONCAT('%', #{keyword}, '%'))
        </if>
    </where>
</sql>
```

- `<where>` 会自动补 WHERE ，并且去掉开头多出来的 AND / OR ，所以 `<if>` 里可以放心用 AND 开头
- `<if test="...">` 条件成立才拼进去，关键字为空的时候就不加模糊查询
- `<include refid="...">` 把上面那段复用进来，让查询和计数用同一套条件

`<set>` 用在 update 上，会自动补 SET ，并去掉结尾多出来的逗号：

```xml
<update id="update">
    UPDATE note_table
    <set>
        <if test="title != null">title=#{title},</if>
        <if test="content != null">content=#{content},</if>
        updated_at=#{updatedAt},
    </set>
    WHERE id = #{id}
</update>
```

### 5. `#{}` 和 `${}`

`#{}` 生成的是 `?` 占位符，走预编译，能防 SQL 注入。`${}` 是把值直接拼进 SQL 字符串，用来接用户输入会用 SQL 注入风险。

> `${}` 也不是完全没用，要动态传表名或者列名的时候只能用 `${}` ，因为 `?` 占位符不能当表名用。不过这种场景很少，能写 `#{}` 就写 `#{}` 。

### 6. 事务

事务是一组操作，要么全部成功，要么全部失败。

新建笔记要往 note_table 插一行，同时还要发一条 MQ 消息。如果中间报错，前面插的数据不能留在库里，这种场景就要用事务。

Spring 的用法是加注解，项目里 5 个写方法都加了：

```java
@Transactional(rollbackFor = Exception.class)
public Note create(Note note, Long userId) {
    ...
}
```

不写注解时，每条 SQL 自己就是一个事务，执行完立刻提交，出错不会回滚。

注解上显式写了 rollbackFor ，是因为 @Transactional 默认只在抛 RuntimeException 和 Error 时回滚。受检异常也属于 Exception ，但默认不回滚，异常照样抛出来，数据留在库里。写上 Exception.class 就是让所有异常都回滚。

表也必须用 InnoDB 。事务是存储引擎提供的能力，MyISAM 不支持事务，表如果是 MyISAM ，注解写了也不生效。建表时写的 ENGINE=InnoDB 就是为这个。

还有一个坑是自调用。@Transactional 靠 AOP 代理实现，只有从外部调用才会经过代理：

```java
public void a() {
    this.b();      // 直接调本对象，绕过代理，b 的事务不生效
}

@Transactional
public void b() { }
```

同一个类里 this.b() 这种调用不走代理，事务不会开。要生效得从别的 Bean 调，或者注入自己。

### 7. 小技巧

① **下划线转驼峰**：库里列名是 created_at 、Java 字段是 createdAt ，开了这个会自动对应，不用手写 resultMap 。

```properties
mybatis.configuration.map-underscore-to-camel-case=true
```

② **自增主键回填**：加上 useGeneratedKeys 和 keyProperty ，insert 完之后可以直接从传进去的对象上拿到数据库生成的 id 。

```xml
<insert id="insert" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO note_table (title, content, created_at, updated_at, user_id)
    VALUES (#{title}, #{content}, #{createdAt}, #{updatedAt}, #{userId})
</insert>
```

### 8. 长文本和图片的存储

#### 大字段问题

- InnoDB 页大小 16KB，一行放不下就发生行溢出，大字段挪到单独的溢出页
- 读这一行的其它列，溢出页也会被带进来，buffer pool 被挤占
- 备份和主从复制要搬这些字节
- 单次请求受 max_allowed_packet 限制
- 正文几十 KB 没问题，图片是几百 KB 到几 MB 的二进制，不适合

#### 长文本存储

① 冷热分离：正文放对象存储，MySQL 留标题、摘要和地址。
② 文档数据库：MongoDB 没有固定表结构，适合变长的内容。
③ 全文检索：Elasticsearch，解决 LIKE '%关键字%' 全表扫的问题。

#### 图片存储

对象存储是专门存文件的服务。常见的有 AWS S3、阿里云 OSS、腾讯云 COS，自建可以用 MinIO，协议和 S3 兼容。

适用于只读不查的大文件。比如笔记封面、用户头像、附件这类。

数据库里只存一个 key，不存文件本身。存 key 不存完整 URL。URL 里的域名和 bucket 会变（换 CDN、换区域、本地调试），存 key 的话读的时候按当前配置拼；存完整 URL 就得批量改数据。

key 命名带上笔记 id 和随机串，比如 `note/104/9f3a2c1e.jpg`。用随机串而不是原始文件名，避免同名覆盖，也避免用户传路径穿越的名字。配套还要存原始文件名、字节数、文件类型，排查和清理用得到。

#### 上传流程

① 经过后端：客户端把文件传给后端，后端转发给对象存储，成功后把 key 写库。实现简单，但图片字节要走两遍。
② 客户端直传：后端签一个预签名 URL 返回，浏览器拿它直接 PUT 到对象存储，成功后再通知后端登记。图片字节一次都不经过应用服务器，并发高的时候差别很大。

两种都要把存储抽成接口。本地开发用 MinIO、线上换 OSS 时只改实现，业务代码不动。

#### 文件清理

先删数据库记录，再删对象存储的文件。反过来的话，删完文件、删库失败，文件就丢了。先删库再删文件，最坏是留个孤儿文件，不影响正确性，事后能扫出来清。

对象存储的删除本身也可能失败。稳一点的做法是丢一条消息到 MQ，让消费者慢慢删，失败还能重试。

#### 判断标准

看这一列会不会出现在 WHERE、ORDER BY、JOIN 里，会不会参与事务。会，留在 MySQL。不会，只是读出来展示，就挪出去，MySQL 留个 key。

正文处在中间。搜索要用到，但不参与排序和关联，暂时留在库里。
