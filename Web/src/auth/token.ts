/**
 * token 的存取与解析。
 * 单独成模块是为了让 api/http.ts 能在不依赖 React 的情况下读取 token。
 */

const TOKEN_KEY = 'jotangnote.token'

/** 后端 LoginCheckInterceptor 判断未登录时会返回这个 code */
export const UNAUTHORIZED = 401

let token = localStorage.getItem(TOKEN_KEY)

export function getToken(): string | null {
  return token
}

export function setToken(value: string): void {
  token = value
  localStorage.setItem(TOKEN_KEY, value)
}

export function clearToken(): void {
  token = null
  localStorage.removeItem(TOKEN_KEY)
}

export interface JwtPayload {
  userId: number
  username: string
  /** 秒级时间戳 */
  exp?: number
}

/**
 * 解析 JWT 的 payload 段。
 *
 * 注意：这里不做签名校验，也做不到——签名只有后端有密钥能验。
 * 前端解析只是为了拿到 userId / username 显示，真正的鉴权永远在后端。
 */
export function decodeToken(value: string): JwtPayload | null {
  const payload = value.split('.')[1]
  if (!payload) return null

  try {
    // JWT 用 base64url，atob 只认标准 base64，需要先还原字符集并补齐 padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    // 用 TextDecoder 而不是 atob 直接转字符串，这样用户名是中文也不会乱码
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload
  } catch {
    return null
  }
}

/** 过期时间过了就当作没登录，省得每个接口都吃一次 401 */
export function isExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}
