import { NavLink, Outlet, useNavigate } from 'react-router'

import { useAuth } from '@/auth/context'
import { AiPet } from '@/components/AiPet'

const navItem = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition ${
    isActive ? 'bg-cream-100 text-caramel-700' : 'text-cocoa-500 hover:text-caramel-700'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-cream-200 bg-cream-50/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-6 px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-caramel-500 text-cocoa-900">
              <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M9 10.5h14M9 16h14M9 21.5h9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <span className="font-medium tracking-tight text-cocoa-900">JotangNote</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navItem}>
              笔记广场
            </NavLink>
            <NavLink to="/mynotes" className={navItem}>
              我的笔记
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {user ? (
              <>
                <NavLink
                  to="/mynotes"
                  className="text-cocoa-500 transition hover:text-caramel-700"
                  title="进入我的笔记"
                >
                  {user.username}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-cream-200 px-3 py-1.5 text-cocoa-700 transition hover:border-caramel-400 hover:text-caramel-700"
                >
                  退出
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="rounded-md bg-caramel-500 px-4 py-1.5 text-cocoa-900 transition hover:bg-caramel-600"
              >
                登录
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>

      <AiPet />
    </div>
  )
}
