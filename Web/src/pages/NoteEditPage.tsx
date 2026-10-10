import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ApiError } from '@/api/http'
import { noteApi } from '@/api/note'
import type { Note } from '@/api/types'
import { ErrorBox, Loading } from '@/components/Feedback'
import { useRequest } from '@/hooks/useRequest'

/** /editor 新建，/editor/:id 编辑，两种模式共用一个表单 */
export function NoteEditPage() {
  const { id } = useParams()
  const noteId = id ? Number(id) : null

  // 新建时没有东西要加载，直接给个 null，省得写两套分支
  const { data, loading, error } = useRequest(
    () => (noteId === null ? Promise.resolve(null) : noteApi.detail(noteId)),
    [noteId],
  )

  if (loading) return <Loading />
  if (error) return <ErrorBox>{error}</ErrorBox>

  // key 让切换笔记时表单状态重建，而不是残留上一篇的内容
  return <NoteEditor key={noteId ?? 'new'} noteId={noteId} initial={data} />
}

interface NoteEditorProps {
  noteId: number | null
  initial: Note | null
}

function NoteEditor({ noteId, initial }: NoteEditorProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const saved =
        noteId === null
          ? await noteApi.create({ title, content })
          : await noteApi.update(noteId, { title, content })

      navigate(`/notes/${saved.id}`, { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '保存失败')
    } finally {
      setPending(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          {noteId === null ? '写一篇' : '编辑笔记'}
        </h1>
        <Link to="/" className="text-sm text-slate-500 transition hover:text-slate-900">
          取消
        </Link>
      </div>

      <input
        className={inputClass}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        required
      />

      <textarea
        className={`${inputClass} min-h-[320px] resize-y leading-7`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="正文…"
      />

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
