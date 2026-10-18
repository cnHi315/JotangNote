import { query, request } from '@/api/http'
import type { Note, PageBean } from '@/api/types'

export function listNotes(keyword: string, page: number, pagesize: number): Promise<PageBean<Note>> {
  return request<PageBean<Note>>(`/notes${query({ keyword, page, pagesize })}`)
}

export function getNote(id: number): Promise<Note> {
  return request<Note>(`/notes/${id}`)
}

export function createNote(title: string, content: string): Promise<Note> {
  return request<Note>('/notes', { method: 'POST', body: { title, content } })
}

export function updateNote(id: number, title: string, content: string): Promise<Note> {
  return request<Note>(`/notes/${id}`, { method: 'PUT', body: { title, content } })
}

export function deleteNote(id: number): Promise<void> {
  return request<void>(`/notes/${id}`, { method: 'DELETE' })
}

/** 公开和私密来回切，不需要传目标状态 */
export function toggleVisibility(id: number): Promise<Note> {
  return request<Note>(`/notes/${id}/visibility`, { method: 'PUT' })
}
