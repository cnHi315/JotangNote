import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { listNotes } from '@/api/note'
import { NoteCard } from '@/components/NoteCard'
import { Pager } from '@/components/Pager'
import { useRequest } from '@/hooks/useRequest'

const PAGESIZE = 6

export function NoteListPage() {
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)

  const { data, error, loading } = useRequest(
    () => listNotes(applied, page, PAGESIZE),
    [applied, page],
  )

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    setPage(1)
    setApplied(keyword.trim())
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-cocoa-900">笔记广场</h1>
          <p className="mt-1 text-sm text-cocoa-400">公开的笔记都在这里。</p>
        </div>
        <Link
          to="/notes/new"
          className="rounded-lg bg-caramel-500 px-4 py-2 text-sm text-cocoa-900 transition hover:bg-caramel-600"
        >
          写笔记
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜标题或正文"
          className="min-w-0 flex-1 rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-cocoa-300 focus:border-caramel-400"
        />
        <button
          type="submit"
          className="rounded-lg border border-cream-200 bg-white px-4 py-2 text-sm text-cocoa-700 transition hover:border-caramel-400 hover:text-caramel-700"
        >
          搜索
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-cocoa-400">加载中…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && data?.list.length === 0 && (
          <p className="rounded-xl border border-dashed border-cream-200 py-12 text-center text-sm text-cocoa-400">
            {applied ? '没有匹配的笔记。' : '还没有公开的笔记。'}
          </p>
        )}
        {data?.list.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {data && <Pager page={page} total={data.total} pagesize={PAGESIZE} onChange={setPage} />}
    </div>
  )
}
