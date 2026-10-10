import { useState } from 'react'
import { Link } from 'react-router'

import { ApiError } from '@/api/http'
import { noteApi } from '@/api/note'
import type { Note } from '@/api/types'
import { userApi } from '@/api/user'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { NoteCard, cardActionClass } from '@/components/NoteCard'
import { Pager } from '@/components/Pager'
import { useRequest } from '@/hooks/useRequest'

const PAGESIZE = 10

export function MyNotesPage() {
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useRequest(
    () => userApi.myNotes(page, PAGESIZE),
    [page],
  )

  async function run(action: () => Promise<unknown>, fallback: string) {
    setActionError(null)
    try {
      await action()
      reload()
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : fallback)
    }
  }

  function handleDelete(note: Note) {
    if (!window.confirm(`确定删除「${note.title || '无标题'}」？`)) return
    void run(() => noteApi.remove(note.id), '删除失败')
  }

  function handleToggle(note: Note) {
    void run(() => noteApi.toggleVisibility(note.id), '操作失败')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">我的笔记</h1>
        <Link
          to="/editor"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-800"
        >
          写一篇
        </Link>
      </div>

      {actionError ? <ErrorBox>{actionError}</ErrorBox> : null}

      {loading ? <Loading /> : null}
      {error ? <ErrorBox>{error}</ErrorBox> : null}

      {!loading && !error && data ? (
        data.list.length === 0 ? (
          <Empty label="你还没有写过笔记" />
        ) : (
          <>
            <div className="space-y-3">
              {data.list.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  actions={
                    <>
                      <button
                        type="button"
                        className={cardActionClass}
                        onClick={() => handleToggle(note)}
                      >
                        {note.isPublic ? '转私密' : '转公开'}
                      </button>
                      <Link to={`/editor/${note.id}`} className={cardActionClass}>
                        编辑
                      </Link>
                      <button
                        type="button"
                        className={`${cardActionClass} hover:text-red-600`}
                        onClick={() => handleDelete(note)}
                      >
                        删除
                      </button>
                    </>
                  }
                />
              ))}
            </div>
            <Pager total={data.total} page={page} pagesize={PAGESIZE} onChange={setPage} />
          </>
        )
      ) : null}
    </div>
  )
}
