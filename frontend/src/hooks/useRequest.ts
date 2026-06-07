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
  const { manual = false, ready = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const argsRef = useRef<any[]>([])
  
  const requestFnRef = useRef(requestFn)
  const onSuccessRef = useRef(options.onSuccess)
  const onErrorRef = useRef(options.onError)
  
  useEffect(() => {
    requestFnRef.current = requestFn
  }, [requestFn])
  
  useEffect(() => {
    onSuccessRef.current = options.onSuccess
  }, [options.onSuccess])
  
  useEffect(() => {
    onErrorRef.current = options.onError
  }, [options.onError])

  const run = useCallback(
    async (...args: any[]) => {
      argsRef.current = args
      setLoading(true)
      setError(null)
      try {
        const result = await requestFnRef.current(...args)
        setData(result)
        onSuccessRef.current?.(result)
        return result
      } catch (err) {
        const e = err as Error
        setError(e)
        onErrorRef.current?.(e)
        throw e
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const refresh = useCallback(() => {
    return run(...argsRef.current)
  }, [run])

  useEffect(() => {
    if (!manual && ready) {
      run()
    }
  }, [...deps, manual, ready])

  return {
    data,
    loading,
    error,
    run,
    refresh,
  }
}

export default useRequest
