import { query, request } from '@/api/http'
import type { Note, PageBean, User } from '@/api/types'

export const userApi = {
  /** POST /users/register */
  register(user: User): Promise<User> {
    return request<User>('/users/register', { method: 'POST', body: user })
  },

  /** POST /users/login —— data 就是 JWT 字符串 */
  login(user: User): Promise<string> {
    return request<string>('/users/login', { method: 'POST', body: user })
  },

  /** GET /users/mynotes —— 当前登录用户的笔记（含私密） */
  myNotes(page: number, pagesize: number): Promise<PageBean<Note>> {
    return request<PageBean<Note>>(`/users/mynotes${query({ page, pagesize })}`)
  },

  /**
   * GET /users/{userId}/notes —— 看别人的笔记。
   * 后端会按"访客"身份过滤掉对方的私密笔记，所以这里拿到的都是公开的。
   */
  notesOf(userId: number, page: number, pagesize: number): Promise<PageBean<Note>> {
    return request<PageBean<Note>>(`/users/${userId}/notes${query({ page, pagesize })}`)
  },
}
