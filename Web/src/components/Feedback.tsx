import { useEffect } from 'react'

type Tone = 'error' | 'success'

const TONE: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-caramel-300 bg-cream-100 text-caramel-700',
}

/** 右下角的轻提示，三秒后自动消失 */
export function Feedback({
  message,
  tone = 'error',
  onClose,
}: {
  message: string | null
  tone?: Tone
  onClose: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2.5 text-sm shadow-lg ${TONE[tone]}`}
    >
      {message}
    </div>
  )
}
