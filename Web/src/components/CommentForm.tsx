import { useState, type FormEvent } from 'react'

export function CommentForm({
  placeholder = '说点什么…',
  submitting,
  onSubmit,
  onCancel,
}: {
  placeholder?: string
  submitting: boolean
  onSubmit: (content: string) => Promise<void> | void
  onCancel?: () => void
}) {
  const [value, setValue] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const content = value.trim()
    if (!content || submitting) return

    await onSubmit(content)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-cocoa-900 outline-none transition placeholder:text-cocoa-300 focus:border-caramel-400"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-cocoa-500 transition hover:text-cocoa-800"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || value.trim() === ''}
          className="rounded-md bg-caramel-500 px-4 py-1.5 text-sm text-cocoa-900 transition hover:bg-caramel-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '提交中…' : '发布'}
        </button>
      </div>
    </form>
  )
}
