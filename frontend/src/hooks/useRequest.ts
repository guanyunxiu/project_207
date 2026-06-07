import { useState, useCallback, useEffect, useRef } from 'react'

interface UseRequestOptions<T> {
  manual?: boolean
  ready?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseRequestResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  run: (...args: any[]) => Promise<T>
  refresh: () => Promise<T>
}

export function useRequest<T>(
  requestFn: (...args: any[]) => Promise<T>,
  deps: any[] = [],
  options: UseRequestOptions<T> = {}
): UseRequestResult<T> {
  const { manual = false, ready = true, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const argsRef = useRef<any[]>([])

  const run = useCallback(
    async (...args: any[]) => {
      argsRef.current = args
      setLoading(true)
      setError(null)
      try {
        const result = await requestFn(...args)
        setData(result)
        onSuccess?.(result)
        return result
      } catch (err) {
        const e = err as Error
        setError(e)
        onError?.(e)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [requestFn, onSuccess, onError]
  )

  const refresh = useCallback(() => {
    return run(...argsRef.current)
  }, [run])

  useEffect(() => {
    if (!manual && ready) {
      run()
    }
  }, [...deps, manual, ready, run])

  return {
    data,
    loading,
    error,
    run,
    refresh,
  }
}

export default useRequest
