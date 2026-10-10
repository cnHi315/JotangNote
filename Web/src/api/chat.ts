import { request } from '@/api/http'

export const chatApi = {
  /**
   * POST /chat
   *
   * 后端签名是 @RequestBody String userMessage，配的转换器是
   * StringHttpMessageConverter —— 它拿到的是原始请求体，不会当成 JSON 解析。
   * 所以这里用 text/plain 直接发纯文本，避免多包一层引号被当成消息内容。
   */
  send(message: string): Promise<string> {
    return request<string>('/chat', {
      method: 'POST',
      body: message,
      rawBody: true,
      contentType: 'text/plain;charset=UTF-8',
    })
  },
}
