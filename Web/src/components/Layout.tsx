import { Link, NavLink, Outlet, useNavigate } from 'react-router'

import { useAuth } from '@/auth/context'
import { AiPet } from '@/components/AiPet'

/** 侧边栏宽度写在这，main 的左边距要和它对齐（w-56 = ml-56） */
const NAV_ITEMS = [
  { to: '/', label: '全部笔记', end: true },
  { to: '/mynotes', label: '我的笔记', end: false },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            JotangNote
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-slate-900 font-medium text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="truncate px-3 py-1.5 text-sm text-slate-500">{user?.username}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
          >
            退出
          </button>
        </div>
      </aside>

      <main className="ml-56 px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* 挂在 Layout 上，所以每个页面都带着它，切页也不会丢对话 */}
      <AiPet />
    </div>
  )
}
