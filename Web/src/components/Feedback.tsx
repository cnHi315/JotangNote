import type { ReactNode } from 'react'

export function Loading({ label = '加载中…' }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-slate-400">{label}</div>
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  )
}

export function Empty({ label = '还没有内容' }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-slate-400">{label}</div>
}
