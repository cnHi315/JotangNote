import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { userApi } from '@/api/user'
import { AuthContext, type AuthState } from '@/auth/context'
import { clearToken, decodeToken, getToken, setToken, type JwtPayload } from '@/auth/token'

export function AuthProvider({ children }: { children: ReactNode }) {
  // 初始值从 localStorage 里的 token 反解出来，
  // 这样刷新页面不用再请求一次后端就能恢复登录态
  const [user, setUser] = useState<JwtPayload | null>(() => {
    const cached = getToken()
    return cached ? decodeToken(cached) : null
  })

  const login = useCallback(async (username: string, password: string) => {
    const jwt = await userApi.login({ username, password })
    setToken(jwt)
    setUser(decodeToken(jwt))
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    // 后端注册接口只返回 User，不发 token，所以注册完还要再登录一次
    await userApi.register({ username, password })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
