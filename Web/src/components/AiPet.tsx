import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'

import { sendChat } from '@/api/chat'

const POSITION_KEY = 'jotangnote.pet.position'
const PET_SIZE = 56

interface Point {
  x: number
  y: number
}

interface Bubble {
  role: 'user' | 'ai'
  text: string
}

function defaultPosition(): Point {
  return {
    x: Math.max(16, window.innerWidth - PET_SIZE - 32),
    y: Math.max(16, window.innerHeight - PET_SIZE - 32),
  }
}

function loadPosition(): Point {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Point
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return clamp(parsed)
    }
  } catch {
    /* 存坏了就用默认位置 */
  }
  return defaultPosition()
}

function clamp(p: Point): Point {
  return {
    x: Math.min(Math.max(8, p.x), window.innerWidth - PET_SIZE - 8),
    y: Math.min(Math.max(8, p.y), window.innerHeight - PET_SIZE - 8),
  }
}

export function AiPet() {
  const [position, setPosition] = useState<Point>(loadPosition)
  const [open, setOpen] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const positionRef = useRef(position)
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [bubbles, open])

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      dx: e.clientX - position.x,
      dy: e.clientY - position.y,
      moved: false,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag) return

    const next = clamp({ x: e.clientX - drag.dx, y: e.clientY - drag.dy })
    if (Math.abs(next.x - position.x) + Math.abs(next.y - position.y) > 3) {
      drag.moved = true
    }
    setPosition(next)
  }

  function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return

    if (drag.moved) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(positionRef.current))
    } else {
      // 没拖动就是点击，切换面板
      setOpen((prev) => !prev)
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setBubbles((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setSending(true)

    try {
      const reply = await sendChat(text)
      setBubbles((prev) => [...prev, { role: 'ai', text: reply }])
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败'
      setBubbles((prev) => [...prev, { role: 'ai', text: `（出错了：${message}）` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-[0_12px_40px_-12px_rgba(74,52,42,0.35)]">
          <div className="flex items-center justify-between border-b border-cream-100 px-4 py-2.5">
            <span className="text-sm font-medium text-cocoa-800">Jotang 助手</span>
            <button
              onClick={() => setOpen(false)}
              className="text-cocoa-400 transition hover:text-cocoa-800"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {bubbles.length === 0 && (
              <p className="text-xs text-cocoa-400">问我某篇笔记写了什么，或者随便聊聊。</p>
            )}
            {bubbles.map((bubble, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  bubble.role === 'user'
                    ? 'ml-auto bg-caramel-500 text-cocoa-900'
                    : 'bg-cream-100 text-cocoa-800'
                }`}
              >
                {bubble.text}
              </div>
            ))}
            {sending && <p className="text-xs text-cocoa-400">正在思考…</p>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-cream-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="说点什么"
              className="min-w-0 flex-1 rounded-md border border-cream-200 px-3 py-1.5 text-sm outline-none focus:border-caramel-400"
            />
            <button
              type="submit"
              disabled={sending || input.trim() === ''}
              className="rounded-md bg-caramel-500 px-3 py-1.5 text-sm text-cocoa-900 transition hover:bg-caramel-600 disabled:opacity-40"
            >
              发送
            </button>
          </form>
        </div>
      )}

      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: position.x, top: position.y, width: PET_SIZE, height: PET_SIZE }}
        className="fixed z-50 flex touch-none animate-pet-float items-center justify-center rounded-full bg-caramel-500 text-cocoa-900 shadow-[0_8px_24px_-6px_rgba(181,101,29,0.6)] transition hover:bg-caramel-600"
        aria-label="打开 AI 助手"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d="M4 6h16v9H9l-5 4V6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  )
}
