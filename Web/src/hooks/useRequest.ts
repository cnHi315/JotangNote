import { useCallback, useEffect, useState, type DependencyList } from 'react'

interface RequestState<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
}

/**
 * 把「加载中 / 出错 / 拿到数据」这三种状态收在一起。
 * deps 变了就重新发起请求，组件卸载后回来也不会再 setState。
 */
export function useRequest<T>(loader: () => Promise<T>, deps: DependencyList = []): RequestState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    loader()
      .then((value) => {
        if (alive) setData(value)
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : '加载失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
    // loader 每次渲染都是新函数，这里按调用方给的 deps 来
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, error, loading, reload }
}
