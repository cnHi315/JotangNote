import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { AuthContext } from '@/auth/context'
import { clearToken, decodeToken, getToken, isExpired, setToken, type JwtPayload } from '@/auth/token'

function readUser(): JwtPayload | null {
  const stored = getToken()
  if (!stored) return null

  const payload = decodeToken(stored)
  // 过期的 token 留着只会让每个请求都吃一次 401，启动时直接清掉
  if (!payload || isExpired(payload)) {
    clearToken()
    return null
  }
  return payload
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(readUser)

  const login = useCallback((value: string) => {
    setToken(value)
    setUser(decodeToken(value))
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
