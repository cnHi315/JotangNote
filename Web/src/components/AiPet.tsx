import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { chatApi } from '@/api/chat'
import { ApiError } from '@/api/http'

/** 悬浮球直径与边距 */
const BALL_SIZE = 56
const MARGIN = 16
/** 面板尺寸，会在小屏上被压缩 */
const PANEL_WIDTH = 380
const PANEL_HEIGHT = 560
/** 球和面板之间的间距 */
const GAP = 12
/** 位移超过这个像素数就当成拖拽，而不是点击 */
const DRAG_THRESHOLD = 4

const POSITION_KEY = 'jotangnote.pet.position'

const SUGGESTIONS = ['帮我总结一下我的笔记', '我最近写了什么？']

interface Position {
  x: number
  y: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

/** 把坐标限制在可视范围内，窗口缩小或换了屏幕后旧坐标可能落在外面 */
function clampPosition(position: Position, viewport: { width: number; height: number }): Position {
  return {
    x: clamp(position.x, MARGIN, viewport.width - BALL_SIZE - MARGIN),
    y: clamp(position.y, MARGIN, viewport.height - BALL_SIZE - MARGIN),
  }
}

function defaultPosition(viewport: { width: number; height: number }): Position {
  return clampPosition(
    {
      x: viewport.width - BALL_SIZE - MARGIN * 2,
      y: viewport.height - BALL_SIZE - MARGIN * 2,
    },
    viewport,
  )
}

function loadPosition(viewport: { width: number; height: number }): Position {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (raw) return clampPosition(JSON.parse(raw) as Position, viewport)
  } catch {
    // 存的内容坏了就当没存过，用默认位置
  }
  return defaultPosition(viewport)
}

export function AiPet() {
  const viewport = useViewport()

  const [rawPosition, setRawPosition] = useState<Position>(() => loadPosition(viewport))
  const [open, setOpen] = useState(false)

  // 窗口缩小后旧坐标可能落到屏幕外。夹一次就够了，不必写回 state——
  // 在 effect 里 setState 会多触发一轮渲染，派生值直接在渲染时算出来更简单
  const position = useMemo(() => clampPosition(rawPosition, viewport), [rawPosition, viewport])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending, open])

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
        moved: false,
      }
    },
    [position.x, position.y],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag) return

      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        drag.moved = true
      }

      setRawPosition(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }, viewport))
    },
    [viewport],
  )

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.releasePointerCapture(event.pointerId)
      const drag = dragRef.current
      dragRef.current = null
      if (!drag) return

      if (drag.moved) {
        // 拖完记下位置，下次进来还在老地方
        localStorage.setItem(POSITION_KEY, JSON.stringify(position))
      } else {
        // 没怎么动 → 当成点击，开合面板
        setOpen((prev) => !prev)
      }
    },
    [position],
  )

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return

    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setInput('')
    setError(null)
    setPending(true)

    try {
      const reply = await chatApi.send(message)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '发送失败')
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void send(input)
  }

  // 面板宽度受视口限制，球在右半边就往左开、在下半边就往上开
  const panelWidth = Math.min(PANEL_WIDTH, viewport.width - MARGIN * 2)
  const panelHeight = Math.min(PANEL_HEIGHT, viewport.height - MARGIN * 2)
  const opensLeft = position.x + BALL_SIZE / 2 > viewport.width / 2
  const opensUp = position.y + BALL_SIZE / 2 > viewport.height / 2

  const panelStyle: CSSProperties = {
    width: panelWidth,
    height: panelHeight,
    left: clamp(
      opensLeft ? position.x - panelWidth - GAP : position.x + BALL_SIZE + GAP,
      MARGIN,
      viewport.width - panelWidth - MARGIN,
    ),
    top: clamp(
      opensUp ? position.y + BALL_SIZE - panelHeight : position.y,
      MARGIN,
      viewport.height - panelHeight - MARGIN,
    ),
  }

  return (
    <>
      {open ? (
        <div
          style={panelStyle}
          className="fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-slate-900">AI 助手</div>
              <div className="text-xs text-slate-400">能查你的笔记</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="收起"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-2 pt-4 text-center">
                <p className="text-xs text-slate-400">问点什么试试</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void send(item)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {pending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-400">
                  思考中…
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="space-y-2 border-t border-slate-100 p-3">
            {error ? (
              <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="说点什么…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900"
              />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                发送
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ left: position.x, top: position.y, width: BALL_SIZE, height: BALL_SIZE }}
        className={`fixed z-50 flex cursor-grab touch-none items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-shadow select-none hover:shadow-xl active:cursor-grabbing ${
          open ? '' : 'animate-pet-float'
        }`}
        aria-label="AI 助手"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path
            d="M12 3v2M8.5 5h7A3.5 3.5 0 0 1 19 8.5v5A3.5 3.5 0 0 1 15.5 17h-4L7 20v-3.2A3.5 3.5 0 0 1 5 13.5v-5A3.5 3.5 0 0 1 8.5 5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="11" r="1" fill="currentColor" />
          <circle cx="14" cy="11" r="1" fill="currentColor" />
        </svg>
      </button>
    </>
  )
}
