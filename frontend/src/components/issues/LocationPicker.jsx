// src/components/issues/LocationPicker.jsx
// GPS auto-detect with a manual map-pin fallback using Leaflet.

import { useEffect, useRef } from 'react'
import { MapPin, Crosshair, X, Loader2 } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function LocationPicker({ value, onChange, error }) {
  const { location, loading, error: gpsError, getLocation, clearLocation } = useGeolocation()
  const mapRef     = useRef(null)
  const leafletMap = useRef(null)
  const markerRef  = useRef(null)

  // When GPS gives us a location, pass it up
  useEffect(() => {
    if (location) onChange(location)
  }, [location])

  // Init Leaflet map for manual pin (only once)
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default icon paths broken by Vite
      delete L.default.Icon.Default.prototype._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.default.map(mapRef.current).setView([20.5937, 78.9629], 5)
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.default.marker([lat, lng]).addTo(map)
        onChange({ lat, lng })
      })

      leafletMap.current = map
    })

    return () => {
      leafletMap.current?.remove()
      leafletMap.current = null
    }
  }, [])

  // Move map + marker when value changes externally (GPS)
  useEffect(() => {
    if (!leafletMap.current || !value) return
    import('leaflet').then(L => {
      leafletMap.current.setView([value.lat, value.lng], 15)
      if (markerRef.current) markerRef.current.setLatLng([value.lat, value.lng])
      else markerRef.current = L.default.marker([value.lat, value.lng]).addTo(leafletMap.current)
    })
  }, [value])

  function handleClear() {
    clearLocation()
    onChange(null)
    if (markerRef.current && leafletMap.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }

  return (
    <div className="space-y-3">
      {/* GPS button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={getLocation}
          disabled={loading}
          className="btn-secondary flex-1"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Crosshair className="w-4 h-4" />
          }
          {loading ? 'Detecting location…' : 'Use My Location'}
        </button>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* GPS error */}
      {gpsError && (
        <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          {gpsError}
        </p>
      )}

      {/* Coordinates display */}
      {value && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 
                        border border-emerald-200 px-3 py-2 rounded-lg">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}

      {/* Manual map pin */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full rounded-xl overflow-hidden border border-gray-200"
          style={{ height: '220px', zIndex: 0 }}
        />
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-xs 
                        text-gray-600 px-2 py-1 rounded-lg pointer-events-none">
          Or click map to pin manually
        </div>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
