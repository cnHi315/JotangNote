import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { noteApi } from '@/api/note'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { NoteCard } from '@/components/NoteCard'
import { Pager } from '@/components/Pager'
import { useRequest } from '@/hooks/useRequest'

const PAGESIZE = 10

export function NoteListPage() {
  const [keyword, setKeyword] = useState('')
  // keyword 是输入框里的实时值，search 是真正提交给后端的关键字，两者分开才不会边打字边请求
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useRequest(
    () => noteApi.page(search, page, PAGESIZE),
    [search, page],
  )

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(keyword.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">全部笔记</h1>
        <Link
          to="/editor"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-800"
        >
          写一篇
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索标题或内容…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm transition hover:bg-slate-100"
        >
          搜索
        </button>
      </form>

      {loading ? <Loading /> : null}
      {error ? <ErrorBox>{error}</ErrorBox> : null}

      {!loading && !error && data ? (
        data.list.length === 0 ? (
          <Empty label={search ? `没有匹配「${search}」的笔记` : '还没有公开笔记'} />
        ) : (
          <>
            <div className="space-y-3">
              {data.list.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
            <Pager total={data.total} page={page} pagesize={PAGESIZE} onChange={setPage} />
          </>
        )
      ) : null}
    </div>
  )
}
