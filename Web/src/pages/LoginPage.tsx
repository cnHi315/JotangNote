import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { login as loginApi, register as registerApi } from '@/api/user'
import { useAuth } from '@/auth/context'
import { Feedback } from '@/components/Feedback'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    setNotice(null)
    try {
      if (mode === 'register') {
        await registerApi(username.trim(), password)
        // 注册完直接登录，少点一步
      }
      const token = await loginApi(username.trim(), password)
      login(token)
      navigate(from, { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cocoa-900 outline-none transition placeholder:text-cocoa-300 focus:border-caramel-400'

  return (
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="text-xl font-medium text-cocoa-900">
        {mode === 'login' ? '登录 JotangNote' : '注册一个新账号'}
      </h1>
      <p className="mt-1 text-sm text-cocoa-400">
        {mode === 'login' ? '焦糖色的笔记，随手写点什么。' : '用户名和密码都不做限制，记住就行。'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          className={input}
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className={input}
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        <button
          type="submit"
          disabled={busy || username.trim() === '' || password === ''}
          className="w-full rounded-lg bg-caramel-500 py-2.5 text-sm text-cocoa-900 transition hover:bg-caramel-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '请稍候…' : mode === 'login' ? '登录' : '注册并登录'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setNotice(null)
        }}
        className="mt-4 w-full text-center text-sm text-cocoa-400 transition hover:text-caramel-700"
      >
        {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
      </button>

      <Feedback message={notice} onClose={() => setNotice(null)} />
    </div>
  )
}
