import { createContext, useContext } from 'react'

import type { JwtPayload } from '@/auth/token'

export interface AuthState {
  /** 未登录为 null；内容来自解析本地 token，不是请求后端拿的 */
  user: JwtPayload | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  }
  return context
}
