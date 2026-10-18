import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import { createNote, getNote, updateNote } from '@/api/note'
import { Feedback } from '@/components/Feedback'

export function NoteEditPage() {
  const { id } = useParams<{ id: string }>()
  const editing = id !== undefined
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    let alive = true
    getNote(Number(id))
      .then((note) => {
        if (!alive) return
        setTitle(note.title)
        setContent(note.content)
      })
      .catch((e: unknown) => {
        if (alive) setNotice(e instanceof Error ? e.message : '加载失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [editing, id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    setBusy(true)
    try {
      const saved = editing
        ? await updateNote(Number(id), title.trim(), content)
        : await createNote(title.trim(), content)
      navigate(`/notes/${saved.id}`, { replace: true })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-cocoa-400">加载中…</p>

  const field =
    'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cocoa-900 outline-none transition placeholder:text-cocoa-300 focus:border-caramel-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-medium tracking-tight text-cocoa-900">
        {editing ? '编辑笔记' : '写一篇新笔记'}
      </h1>

      <input
        className={field}
        placeholder="标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${field} min-h-80 resize-y leading-7`}
        placeholder="正文…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-4 py-2 text-sm text-cocoa-500 transition hover:text-cocoa-800"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={busy || title.trim() === '' || content.trim() === ''}
          className="rounded-lg bg-caramel-500 px-5 py-2 text-sm text-cocoa-900 transition hover:bg-caramel-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '保存中…' : '保存'}
        </button>
      </div>

      <Feedback message={notice} onClose={() => setNotice(null)} />
    </form>
  )
}
