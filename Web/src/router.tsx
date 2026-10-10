import { Navigate, createBrowserRouter } from 'react-router'

import { setUnauthorizedHandler } from '@/api/http'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { MyNotesPage } from '@/pages/MyNotesPage'
import { NoteDetailPage } from '@/pages/NoteDetailPage'
import { NoteEditPage } from '@/pages/NoteEditPage'
import { NoteListPage } from '@/pages/NoteListPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  // RequireAuth 判断登录，Layout 提供导航栏，两者之间才是具体页面
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <NoteListPage /> },
          { path: 'mynotes', element: <MyNotesPage /> },
          { path: 'notes/:id', element: <NoteDetailPage /> },
          { path: 'editor', element: <NoteEditPage /> },
          { path: 'editor/:id', element: <NoteEditPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])

// 任何请求拿到 401 都会走到这里（见 api/http.ts），统一踢回登录页
setUnauthorizedHandler(() => {
  void router.navigate('/login', { replace: true })
})
