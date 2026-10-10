import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ApiError } from '@/api/http'
import { noteApi } from '@/api/note'
import { ErrorBox, Loading } from '@/components/Feedback'
import { useAuth } from '@/auth/context'
import { useRequest } from '@/hooks/useRequest'
import { formatTime } from '@/utils/format'

export function NoteDetailPage() {
  const { id } = useParams()
  const noteId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: note, loading, error, reload } = useRequest(
    () => noteApi.detail(noteId),
    [noteId],
  )

  // 后端把"非本人的私密笔记"也返回 404，所以这里只按 userId 判断能否操作
  const isOwner = note != null && user != null && note.userId === user.userId

  async function handleDelete() {
    if (!note || !window.confirm(`确定删除「${note.title || '无标题'}」？`)) return
    setActionError(null)
    try {
      await noteApi.remove(note.id)
      navigate('/mynotes', { replace: true })
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : '删除失败')
    }
  }

  async function handleToggleVisibility() {
    if (!note) return
    setActionError(null)
    try {
      await noteApi.toggleVisibility(note.id)
      reload()
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : '操作失败')
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!note) return null

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-block text-sm text-slate-500 transition hover:text-slate-900">
        ← 返回列表
      </Link>

      <article className="rounded-xl border border-slate-200 bg-white p-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {note.title || '无标题'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>创建于 {formatTime(note.createdAt)}</span>
            <span>更新于 {formatTime(note.updatedAt)}</span>
            <span
              className={
                note.isPublic
                  ? 'rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700'
                  : 'rounded bg-amber-50 px-1.5 py-0.5 text-amber-700'
              }
            >
              {note.isPublic ? '公开' : '私密'}
            </span>
          </div>
        </header>

        <div className="pt-4 text-[15px] leading-7 whitespace-pre-wrap text-slate-700">
          {note.content || '（空）'}
        </div>
      </article>

      {actionError ? <ErrorBox>{actionError}</ErrorBox> : null}

      {isOwner ? (
        <div className="flex gap-2">
          <Link
            to={`/editor/${note.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:bg-slate-100"
          >
            编辑
          </Link>
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm transition hover:bg-slate-100"
          >
            改为{note.isPublic ? '私密' : '公开'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            删除
          </button>
        </div>
      ) : null}
    </div>
  )
}
