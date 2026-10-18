# JotangNote

JotangNote 是一个笔记应用。前端是 React + Vite，后端是 Spring Boot，依赖 MySQL、Redis、RabbitMQ。

仓库分三部分：

- `Project/` 后端
- `Web/` 前端
- `Notes/` 环境搭建和学习笔记

整个服务用 Docker Compose 编排，`compose.yaml` 在仓库根目录。

## Docker 部署

### 前置要求

安装 Docker 和 Docker Compose v2。

### 配置

复制环境变量模板：

```bash
cp .env.example .env
```

打开 `.env`，把 `change-me` 换成自己的密码。`JWT_SECRET_KEY` 至少 32 字节，可以用 `openssl rand -hex 32` 生成。`JOTANGNOTE_API_KEY` 是智谱 GLM 的 key，不填的话 AI 助手不可用，其它功能正常。

`.env` 里还定义了宿主机端口，默认是 3306、6379、5672、15672、80、8080，被占用时改这里即可。容器之间用服务名互相访问，改宿主机端口不影响内部通信。

`.env` 已加入 `.gitignore`，不会被提交。

### 启动

```bash
docker compose up -d --build
```

首次启动会拉取 MySQL、Redis、RabbitMQ 镜像并构建前后端镜像，时间取决于网络。MySQL、Redis、RabbitMQ 的健康检查通过之后，后端才会启动。

打开前端地址注册账号，登录后即可使用。

### 访问

- 前端 `http://localhost:${WEB_PORT}`，默认 80
- 后端 `http://localhost:${BACKEND_PORT}`，默认 8080
- RabbitMQ 管理界面 `http://localhost:${RABBITMQ_UI_PORT}`，默认 15672

前端由 nginx 托管，`/api/` 开头的请求转发到 `backend:8080` 并去掉 `/api` 前缀。浏览器视角下前后端同源，后端不需要 CORS 配置。

### 数据持久化

启动后会创建四个 volume：

- `mysql-data`：数据库
- `redis-data`：Redis 数据
- `rabbitmq-data`：RabbitMQ 数据
- `backend-logs`：后端日志，对应容器里的 `/app/logs`

数据库第一次启动时由 `schema.sql` 自动建表。`spring.sql.init.mode=always`，建表语句带 `IF NOT EXISTS`，重复启动不会出错。

清空所有数据并重新开始：

```bash
docker compose down -v
```

### 常用命令

```bash
docker compose ps                 # 查看容器状态
docker compose logs -f backend    # 看后端日志
docker compose logs -f            # 看全部日志
docker compose stop               # 停止容器，保留数据
docker compose down               # 删除容器，保留数据
docker compose down -v            # 删除容器和 volume
```

### 镜像构成

- 后端：多阶段构建，Maven 镜像里执行 `mvn clean package`，运行阶段只保留 JRE 和 jar
- 前端：Node 镜像里执行 `npm run build`，产物复制到 nginx 镜像

## 本地开发

后端在本机运行：

```bash
cd Project
mvn spring-boot:run
```

需要本机已经启动 MySQL、Redis、RabbitMQ，连接信息在 `Project/src/main/resources/application.properties`。

前端见 `Web/README.md`。
