import { Link } from 'react-router'

import type { Note } from '@/api/types'
import { excerpt, formatTime } from '@/utils/format'

interface NoteCardProps {
  note: Note
  /** 右侧插槽：列表页用来放"编辑/删除"这类当前页专属的操作 */
  actions?: React.ReactNode
}

export function NoteCard({ note, actions }: NoteCardProps) {
  return (
    <article className="group rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/notes/${note.id}`} className="block">
            <h3 className="truncate font-medium text-slate-900 group-hover:text-blue-700">
              {note.title || '无标题'}
            </h3>
          </Link>

          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{excerpt(note.content)}</p>

          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span>{formatTime(note.updatedAt)}</span>
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
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </article>
  )
}

/** 列表页里统一的小按钮样式 */
export const cardActionClass =
  'rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900'
