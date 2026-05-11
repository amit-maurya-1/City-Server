// src/hooks/useGeolocation.js
// Wraps browser GPS API with loading/error state.

import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)   // { lat, lng }
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS is not supported by your browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        const messages = {
          1: 'Location access denied. Please allow location in browser settings.',
          2: 'Location unavailable. Try again or pin manually on the map.',
          3: 'Location request timed out. Try again.',
        }
        setError(messages[err.code] ?? 'Could not get location.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  function clearLocation() {
    setLocation(null)
    setError(null)
  }

  return { location, loading, error, getLocation, clearLocation }
}
