import { createBrowserRouter, Navigate } from 'react-router'

import { setUnauthorizedHandler } from '@/api/http'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { MyNotesPage } from '@/pages/MyNotesPage'
import { NoteDetailPage } from '@/pages/NoteDetailPage'
import { NoteEditPage } from '@/pages/NoteEditPage'
import { NoteListPage } from '@/pages/NoteListPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <NoteListPage />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      {
        path: 'mynotes',
        element: (
          <RequireAuth>
            <MyNotesPage />
          </RequireAuth>
        ),
      },
      {
        path: 'notes/new',
        element: (
          <RequireAuth>
            <NoteEditPage />
          </RequireAuth>
        ),
      },
      {
        path: 'notes/:id',
        element: (
          <RequireAuth>
            <NoteDetailPage />
          </RequireAuth>
        ),
      },
      {
        path: 'notes/:id/edit',
        element: (
          <RequireAuth>
            <NoteEditPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

// 任何请求遇到 401（token 过期、被清掉）就回登录页
setUnauthorizedHandler(() => {
  void router.navigate('/login', { replace: true })
})
