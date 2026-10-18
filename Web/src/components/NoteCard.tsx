import { Link } from 'react-router'

import type { Note } from '@/api/types'
import { excerpt, formatTime } from '@/utils/format'

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      to={`/notes/${note.id}`}
      className="group block rounded-xl border border-cream-200 bg-white p-5 transition hover:border-caramel-400 hover:shadow-[0_4px_20px_-8px_rgba(181,101,29,0.35)]"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-medium text-cocoa-900 group-hover:text-caramel-700">{note.title}</h3>
        {!note.isPublic && (
          <span className="shrink-0 rounded-full bg-cream-100 px-2 py-0.5 text-xs text-cocoa-500">私密</span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-cocoa-500">{excerpt(note.content)}</p>
      <p className="mt-3 text-xs text-cocoa-400">{formatTime(note.createdAt)}</p>
    </Link>
  )
}
