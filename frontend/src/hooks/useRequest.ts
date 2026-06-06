import { useState, useCallback } from 'react'
import request from '@/api/request'

interface UseRequestOptions {
  manual?: boolean
}

export function useRequest<T>(url: string, _options: UseRequestOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(async (params?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await request.get(url, { params })
      setData(result.data as T)
      return result.data as T
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [url])

  return {
    data,
    loading,
    error,
    run,
  }
}

export default useRequest
