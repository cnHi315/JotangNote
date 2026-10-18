import { request } from '@/api/http'
import type { Comment } from '@/api/types'

/** 返回的是树根列表，每个节点通过 children 往下挂 */
export function getComments(noteId: number): Promise<Comment[]> {
  return request<Comment[]>(`/notes/${noteId}/comments`)
}

/**
 * 发评论是异步的：后端只做校验和投递，返回一个事件 id。
 * 真正的入库由消费者完成，所以调用之后要等一会儿再刷新列表。
 */
export function createComment(
  noteId: number,
  content: string,
  parentId: number | null = null,
): Promise<string> {
  return request<string>(`/notes/${noteId}/comments`, {
    method: 'POST',
    body: { content, parentId },
  })
}

/** 同样是异步，返回事件 id */
export function deleteComment(noteId: number, id: number): Promise<string> {
  return request<string>(`/notes/${noteId}/comments/${id}`, { method: 'DELETE' })
}
