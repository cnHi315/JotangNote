import { useState } from 'react'
import { Link } from 'react-router'

import { getOwnNotes } from '@/api/user'
import { NoteCard } from '@/components/NoteCard'
import { Pager } from '@/components/Pager'
import { useRequest } from '@/hooks/useRequest'

const PAGESIZE = 6

export function MyNotesPage() {
  const [page, setPage] = useState(1)
  const { data, error, loading } = useRequest(() => getOwnNotes(page, PAGESIZE), [page])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-cocoa-900">我的笔记</h1>
          <p className="mt-1 text-sm text-cocoa-400">公开的和私密的都在这里。</p>
        </div>
        <Link
          to="/notes/new"
          className="rounded-lg bg-caramel-500 px-4 py-2 text-sm text-cocoa-900 transition hover:bg-caramel-600"
        >
          写笔记
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-cocoa-400">加载中…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && data?.list.length === 0 && (
          <p className="rounded-xl border border-dashed border-cream-200 py-12 text-center text-sm text-cocoa-400">
            还没写过笔记。
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
