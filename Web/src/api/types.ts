/**
 * 后端契约的 TypeScript 映射。
 * 这里的每个类型都对应 Project/ 下的一个 Java 类，改后端时要同步改这里。
 */

/** 对应 com.example.common.Result<T> */
export interface Result<T> {
  code: number
  msg: string
  data: T
}

/** 对应 com.example.common.PageBean<T> */
export interface PageBean<T> {
  total: number
  list: T[]
}

/** 对应 com.example.entity.Note */
export interface Note {
  id: number
  title: string
  content: string
  /** Jackson 序列化 LocalDateTime 得到的是 ISO-8601 字符串，如 2026-10-10T16:17:00 */
  createdAt: string
  updatedAt: string
  userId: number
  isPublic: boolean
}

/** 对应 com.example.entity.User，password 只在注册/登录时上行 */
export interface User {
  id?: number
  username: string
  password?: string
  createdAt?: string
}

/** 业务状态码，对应 Result 里 code 的取值 */
export const CODE = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const
