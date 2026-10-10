import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/auth/context'

/** 包在需要登录的路由外面，未登录就踢回登录页 */
export function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // 记下原本要去的地址，登录成功后跳回去，而不是一律回首页
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  return <Outlet />
}
