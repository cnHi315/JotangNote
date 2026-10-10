interface PagerProps {
  total: number
  page: number
  pagesize: number
  onChange: (page: number) => void
}

export function Pager({ total, page, pagesize, onChange }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pagesize))
  if (total === 0) return null

  const buttonClass =
    'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
      <span>
        共 {total} 条 · 第 {page} / {totalPages} 页
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
