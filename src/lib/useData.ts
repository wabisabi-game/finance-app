import { useCallback, useEffect, useState } from 'react'

/** IndexedDBなどの非同期データを読み込む。reload() で読み直す */
export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []): [T | undefined, () => void] {
  const [data, setData] = useState<T>()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    void loader().then((d) => {
      if (alive) setData(d)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return [data, reload]
}
