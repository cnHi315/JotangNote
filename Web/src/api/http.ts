import { clearToken, getToken, UNAUTHORIZED } from '@/auth/token'
import type { Result } from '@/api/types'

/** 请求失败时抛出的错误，code 为后端 Result.code */
export class ApiError extends Error {
  readonly code: number

  constructor(code: number, msg: string) {
    super(msg)
    this.name = 'ApiError'
    this.code = code
  }
}

/** 网络层压根没通（后端没起、代理没配好）时用的 code */
export const NETWORK_ERROR = -1

/** 所有请求都带这个前缀，由 vite.config.ts 的 proxy 转发到 8080 */
const BASE_URL = '/api'

/** 401 时通知上层跳登录页，由 router 在启动时注册 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: string
  /** 默认会被 JSON.stringify；rawBody 为 true 时按原样发送 */
  body?: unknown
  /** 传 true 表示 body 已经是最终字符串，不要再 stringify */
  rawBody?: boolean
  /** 覆盖 Content-Type，默认 application/json */
  contentType?: string
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, rawBody = false, contentType } = options

  const headers = new Headers()
  const token = getToken()
  // 后端 LoginCheckInterceptor 读的是名为 token 的头，不是 Authorization
  if (token) headers.set('token', token)

  let payload: string | undefined
  if (body !== undefined) {
    headers.set('Content-Type', contentType ?? 'application/json')
    payload = rawBody ? (body as string) : JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(BASE_URL + path, { method, headers, body: payload })
  } catch {
    throw new ApiError(NETWORK_ERROR, '无法连接后端，请确认服务已启动')
  }

  let result: Result<T>
  try {
    result = (await response.json()) as Result<T>
  } catch {
    throw new ApiError(response.status, `响应格式异常（HTTP ${response.status}）`)
  }

  // 后端的业务异常也是 HTTP 200，错误码在 body 里，所以不能只看 response.ok
  if (result.code !== 200) {
    if (result.code === UNAUTHORIZED) {
      clearToken()
      onUnauthorized?.()
    }
    throw new ApiError(result.code, result.msg || '请求失败')
  }

  return result.data
}

/** 把对象拼成查询串，值为 undefined / null / '' 的键会被丢掉 */
export function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const str = search.toString()
  return str ? `?${str}` : ''
}
