# JotangNote 前端

JotangNote 的 React 前端，配合 `../Project`（Spring Boot 后端）使用。

## 运行

后端要先在 8080 起来，然后：

```bash
npm install
npm run dev          # http://localhost:5173
```

其它命令：

```bash
npm run build        # tsc + vite build，产物在 dist/
npm run lint         # oxlint
```

## 和后端怎么对接

开发时前端统一请求 `/api/**`，由 `vite.config.ts` 里的 proxy 转发到 `http://localhost:8080` 并去掉 `/api` 前缀。
浏览器视角下前后端同源，所以**后端不需要任何 CORS 配置**。

有两处和后端的约定容易踩，改接口时留意：

- 认证走名为 `token` 的请求头，**不是** `Authorization: Bearer`
- 后端业务异常同样返回 HTTP 200，错误码在 `Result.code` 里 —— 判断成败要看 `code`，不能看 `response.ok`

## 目录

| 目录 | 作用 |
| --- | --- |
| `src/api/` | 后端契约：类型 + 请求函数。`types.ts` 和 `Project` 下的 Java 类一一对应 |
| `src/auth/` | token 存取、JWT 解析、登录态 Context |
| `src/components/` | 复用组件，`Layout` 是侧边栏框架，`AiPet` 是悬浮 AI 助手 |
| `src/pages/` | 页面 |
| `src/hooks/` | `useRequest`：统一的 loading / error / 重试 |
| `src/utils/` | 时间格式化、正文截断 |

## 关于 AI 助手

它不是独立页面，而是挂在 `Layout` 上的悬浮小球，每个页面都在。可以拖动，位置记在 localStorage。

对话上下文由后端存在 Redis 里（按用户隔离），所以**刷新页面本地记录会丢，但 AI 还记得**。
