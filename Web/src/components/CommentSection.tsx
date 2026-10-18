import { useState } from 'react'

import { createComment, deleteComment, getComments } from '@/api/comment'
import type { Comment } from '@/api/types'
import { useAuth } from '@/auth/context'
import { CommentForm } from '@/components/CommentForm'
import { CommentTree } from '@/components/CommentTree'
import { Feedback } from '@/components/Feedback'
import { useRequest } from '@/hooks/useRequest'

/** 异步落库，发完要等一会儿列表里才看得到 */
const REFRESH_DELAY = 900

export function CommentSection({ noteId }: { noteId: number }) {
  const { user } = useAuth()
  const { data, error, loading, reload } = useRequest(() => getComments(noteId), [noteId])

  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const comments = data ?? []

  function refreshLater() {
    setTimeout(reload, REFRESH_DELAY)
  }

  async function handleCreate(content: string) {
    setSubmitting(true)
    try {
      await createComment(noteId, content)
      refreshLater()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(content: string) {
    if (replyingTo === null) return
    setSubmitting(true)
    try {
      await createComment(noteId, content, replyingTo)
      setReplyingTo(null)
      refreshLater()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '回复失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(comment: Comment) {
    setSubmitting(true)
    try {
      await deleteComment(noteId, comment.id)
      refreshLater()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 border-t border-cream-200 pt-8">
      <h2 className="text-sm font-medium text-cocoa-800">
        评论 <span className="text-cocoa-400">{comments.length > 0 ? '' : ''}</span>
      </h2>

      <div className="mt-4">
        <CommentForm placeholder="写下你的评论…" submitting={submitting} onSubmit={handleCreate} />
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-cocoa-400">加载中…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && comments.length === 0 && (
          <p className="text-sm text-cocoa-400">还没有评论，来说第一句吧。</p>
        )}
        {!loading && !error && comments.length > 0 && user && (
          <CommentTree
            comments={comments}
            currentUserId={user.userId}
            replyingTo={replyingTo}
            submitting={submitting}
            onReply={(c) => setReplyingTo((prev) => (prev === c.id ? null : c.id))}
            onCancelReply={() => setReplyingTo(null)}
            onSubmitReply={handleReply}
            onDelete={handleDelete}
          />
        )}
      </div>

      <Feedback message={notice} onClose={() => setNotice(null)} />
    </section>
  )
}
