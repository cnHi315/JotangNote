import { request } from '@/api/http'

/**
 * 后端 AIController 收的是 @RequestBody String，
 * 所以这里把对象自己序列化好再发（rawBody），不要让它再 stringify 一次。
 */
export function sendChat(userMessage: string): Promise<string> {
  return request<string>('/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage }),
    rawBody: true,
  })
}
