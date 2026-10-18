export function Pager({
  page,
  total,
  pagesize,
  onChange,
}: {
  page: number
  total: number
  pagesize: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pagesize))
  if (pages <= 1) return null

  const button =
    'rounded-md border border-cream-200 px-3 py-1.5 text-sm text-cocoa-700 transition hover:border-caramel-400 hover:text-caramel-700 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav className="mt-8 flex items-center justify-center gap-3">
      <button className={button} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        上一页
      </button>
      <span className="text-sm text-cocoa-500">
        第 <span className="text-caramel-700">{page}</span> / {pages} 页 · 共 {total} 篇
      </span>
      <button className={button} disabled={page >= pages} onClick={() => onChange(page + 1)}>
        下一页
      </button>
    </nav>
  )
}
