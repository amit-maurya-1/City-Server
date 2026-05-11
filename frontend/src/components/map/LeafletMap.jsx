// src/components/map/LeafletMap.jsx
// Core map component. Renders color-coded markers per issue status.
// Uses react-leaflet for declarative marker management.

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { renderToString } from 'react-dom/server'
import { MARKER_COLORS, CITY_MAP_ZOOM, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import IssuePopup from './IssuePopup'
import 'leaflet/dist/leaflet.css'

// Helper: fly to city center when selectedCity changes
function CityFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom])
  return null
}

// City center coords — add more as needed
const CITY_CENTERS = {
  delhi:     { lat: 28.6139, lng: 77.2090 },
  mumbai:    { lat: 19.0760, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai:   { lat: 13.0827, lng: 80.2707 },
  kolkata:   { lat: 22.5726, lng: 88.3639 },
  pune:      { lat: 18.5204, lng: 73.8567 },
  jaipur:    { lat: 26.9124, lng: 75.7873 },
}

export default function LeafletMap({ issues, selectedCitySlug, onMarkerClick }) {
  const cityCenter = selectedCitySlug ? CITY_CENTERS[selectedCitySlug] : null

  return (
    <MapContainer
      center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      className="map-container"
      // Prevent scroll hijack on desktop
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Fly to city when selection changes */}
      {cityCenter && (
        <CityFlyTo center={[cityCenter.lat, cityCenter.lng]} zoom={CITY_MAP_ZOOM} />
      )}

      {/* Issue markers */}
      {issues.map(issue => (
        <CircleMarker
          key={issue.id}
          center={[issue.latitude, issue.longitude]}
          radius={issue.upvotes_count > 10 ? 12 : issue.upvotes_count > 3 ? 9 : 7}
          pathOptions={{
            color:       MARKER_COLORS[issue.status] ?? '#6B7280',
            fillColor:   MARKER_COLORS[issue.status] ?? '#6B7280',
            fillOpacity: 0.85,
            weight:      2,
          }}
          eventHandlers={{
            click: () => onMarkerClick?.(issue),
          }}
        >
          <Popup minWidth={260} maxWidth={280} className="cityserve-popup">
            <IssuePopup issue={issue} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
