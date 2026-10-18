import { createContext, useContext } from 'react'

import type { JwtPayload } from '@/auth/token'

export interface AuthValue {
  /** 从 token 里解析出来的当前用户，未登录为 null */
  user: JwtPayload | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
