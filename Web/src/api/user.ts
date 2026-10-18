import { query, request } from '@/api/http'
import type { Note, PageBean, User } from '@/api/types'

export function register(username: string, password: string): Promise<User> {
  return request<User>('/users/register', {
    method: 'POST',
    body: { username, password },
  })
}

/** 登录成功后拿到的是一段 JWT 字符串 */
export function login(username: string, password: string): Promise<string> {
  return request<string>('/users/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function getOwnNotes(page: number, pagesize: number): Promise<PageBean<Note>> {
  return request<PageBean<Note>>(`/users/mynotes${query({ page, pagesize })}`)
}

/** 看别人的笔记列表，后端对这个查询做了缓存 */
export function getUserNotes(userId: number, page: number, pagesize: number): Promise<PageBean<Note>> {
  return request<PageBean<Note>>(`/users/${userId}/notes${query({ page, pagesize })}`)
}
