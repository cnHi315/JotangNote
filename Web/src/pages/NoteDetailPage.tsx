import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { deleteNote, getNote, toggleVisibility } from '@/api/note'
import { useAuth } from '@/auth/context'
import { CommentSection } from '@/components/CommentSection'
import { Feedback } from '@/components/Feedback'
import { useRequest } from '@/hooks/useRequest'
import { formatTime } from '@/utils/format'

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const noteId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: note, error, loading, reload } = useRequest(() => getNote(noteId), [noteId])
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isOwner = note !== null && user !== null && note.userId === user.userId

  async function handleDelete() {
    if (!note || !window.confirm('确定删除这篇笔记？')) return
    setBusy(true)
    try {
      await deleteNote(note.id)
      navigate('/mynotes', { replace: true })
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle() {
    if (!note) return
    setBusy(true)
    try {
      await toggleVisibility(note.id)
      reload()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-cocoa-400">加载中…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!note) return null

  const action =
    'rounded-md border border-cream-200 px-3 py-1.5 text-sm text-cocoa-700 transition hover:border-caramel-400 hover:text-caramel-700 disabled:opacity-40'

  return (
    <article>
      <Link to="/" className="text-sm text-cocoa-400 transition hover:text-caramel-700">
        ← 返回列表
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-medium leading-snug tracking-tight text-cocoa-900">{note.title}</h1>
          {!note.isPublic && (
            <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-xs text-cocoa-500">
              私密
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-cocoa-400">
          {formatTime(note.createdAt)}
          {note.updatedAt !== note.createdAt && ` · 修改于 ${formatTime(note.updatedAt)}`}
        </p>
      </header>

      {isOwner && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/notes/${note.id}/edit`} className={action}>
            编辑
          </Link>
          <button className={action} onClick={handleToggle} disabled={busy}>
            {note.isPublic ? '设为私密' : '设为公开'}
          </button>
          <button className={action} onClick={handleDelete} disabled={busy}>
            删除
          </button>
        </div>
      )}

      <div className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-cocoa-800">{note.content}</div>

      <CommentSection noteId={note.id} />

      <Feedback message={notice} onClose={() => setNotice(null)} />
    </article>
  )
}
