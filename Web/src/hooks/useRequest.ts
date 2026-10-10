import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/api/http'

interface RequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** 手动重新加载，用在删除/更新之后刷新列表 */
  reload: () => void
}

/**
 * 加载远端数据的最小封装：负责 loading / error / 重试。
 *
 * deps 的用法和 useEffect 一致，但数组长度必须恒定。
 * loader 每次渲染都是新函数，故意不放进依赖，真正的依赖由 deps 声明。
 */
export function useRequest<T>(loader: () => Promise<T>, deps: unknown[]): RequestState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(cause instanceof ApiError ? cause.message : '加载失败')
      })
      .finally(() => {
        // 组件已卸载还 setState 会触发 React 警告，用标志位挡掉
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, error, reload }
}
