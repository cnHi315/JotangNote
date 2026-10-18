import type { Comment } from '@/api/types'
import { CommentForm } from '@/components/CommentForm'
import { relativeTime } from '@/utils/format'

/** 缩进最多三层，再深就贴着左边，不然窄屏会被挤没 */
const MAX_INDENT = 3

interface TreeProps {
  currentUserId: number
  replyingTo: number | null
  submitting: boolean
  onReply: (comment: Comment) => void
  onCancelReply: () => void
  onSubmitReply: (content: string) => Promise<void>
  onDelete: (comment: Comment) => void
}

function CommentNode({ comment, depth, ...props }: { comment: Comment; depth: number } & TreeProps) {
  const isOwn = !comment.isDeleted && comment.userId === props.currentUserId
  const indent = Math.min(depth, MAX_INDENT)

  return (
    <li>
      <div
        className={indent > 0 ? 'border-l border-cream-200 pl-4' : ''}
        style={indent > 0 ? { marginLeft: (indent - 1) * 16 } : undefined}
      >
        <div className="py-2">
          <div className="flex items-baseline gap-2 text-xs">
            <span className={comment.isDeleted ? 'text-cocoa-300' : 'font-medium text-caramel-700'}>
              {comment.username ?? '已注销'}
            </span>
            <span className="text-cocoa-300">{relativeTime(comment.createdAt)}</span>
          </div>

          <p className={`mt-1 text-sm leading-relaxed ${comment.isDeleted ? 'italic text-cocoa-300' : 'text-cocoa-800'}`}>
            {comment.isDeleted ? '该评论已删除' : comment.content}
          </p>

          {!comment.isDeleted && (
            <div className="mt-1 flex gap-3 text-xs">
              <button
                onClick={() => props.onReply(comment)}
                className="text-cocoa-400 transition hover:text-caramel-700"
              >
                回复
              </button>
              {isOwn && (
                <button
                  onClick={() => props.onDelete(comment)}
                  className="text-cocoa-400 transition hover:text-red-600"
                >
                  删除
                </button>
              )}
            </div>
          )}

          {props.replyingTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                placeholder={`回复 ${comment.username ?? ''}…`}
                submitting={props.submitting}
                onSubmit={props.onSubmitReply}
                onCancel={props.onCancelReply}
              />
            </div>
          )}
        </div>

        {comment.children.length > 0 && (
          <ul>
            {comment.children.map((child) => (
              <CommentNode key={child.id} comment={child} depth={depth + 1} {...props} />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

export function CommentTree({ comments, ...props }: { comments: Comment[] } & TreeProps) {
  return (
    <ul className="space-y-1">
      {comments.map((comment) => (
        <CommentNode key={comment.id} comment={comment} depth={0} {...props} />
      ))}
    </ul>
  )
}
