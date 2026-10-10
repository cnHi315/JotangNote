import { query, request } from '@/api/http'
import type { Note, PageBean } from '@/api/types'

/** 新建/更新时只需要这两个字段，其余由后端补 */
export type NoteInput = Pick<Note, 'title' | 'content'>

export const noteApi = {
  /** GET /notes —— 按关键字分页查公开笔记，keyword 为空则查全部 */
  page(keyword: string, page: number, pagesize: number): Promise<PageBean<Note>> {
    return request<PageBean<Note>>(`/notes${query({ keyword, page, pagesize })}`)
  },

  /** GET /notes/{id} —— 私密笔记非本人访问会返回 404 */
  detail(id: number): Promise<Note> {
    return request<Note>(`/notes/${id}`)
  },

  /** POST /notes */
  create(input: NoteInput): Promise<Note> {
    return request<Note>('/notes', { method: 'POST', body: input })
  },

  /** PUT /notes/{id} */
  update(id: number, input: NoteInput): Promise<Note> {
    return request<Note>(`/notes/${id}`, { method: 'PUT', body: input })
  },

  /** DELETE /notes/{id} */
  remove(id: number): Promise<void> {
    return request<void>(`/notes/${id}`, { method: 'DELETE' })
  },

  /** PUT /notes/{id}/visibility —— 公开/私密互相切换 */
  toggleVisibility(id: number): Promise<Note> {
    return request<Note>(`/notes/${id}/visibility`, { method: 'PUT' })
  },
}
