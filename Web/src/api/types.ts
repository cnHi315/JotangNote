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
  /** Jackson 序列化 LocalDateTime 得到的是 ISO-8601 字符串 */
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

/**
 * 对应 com.example.entity.Comment。
 * children 由后端在查出平表后建好树再返回，前端直接递归渲染。
 * 已删除的评论 content 和 username 都是 null，节点本身保留在树上。
 */
export interface Comment {
  id: number
  noteId: number
  userId: number
  username: string | null
  parentId: number | null
  content: string | null
  createdAt: string
  isDeleted: boolean
  noteIsDeleted: boolean
  children: Comment[]
}
