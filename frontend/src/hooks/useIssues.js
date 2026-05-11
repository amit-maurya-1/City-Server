// src/hooks/useIssues.js
// Fetches city-scoped issues with optional filters.
// Re-fetches automatically when city or filters change.

import { useState, useEffect, useCallback } from 'react'
import { fetchIssuesForCity } from '@/services/issueService'

export function useIssues(cityId, filters = {}) {
  const [issues, setIssues]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!cityId) { setIssues([]); return }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIssuesForCity(cityId, filters)
      setIssues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cityId, filters.status, filters.category])

  useEffect(() => { load() }, [load])

  return { issues, loading, error, refresh: load }
}
