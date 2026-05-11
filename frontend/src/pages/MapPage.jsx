// src/pages/MapPage.jsx
// Public map view. Works without login.
// City-scoped issues with status/category filters.

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, WifiOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useIssues } from '@/hooks/useIssues'
import LeafletMap from '@/components/map/LeafletMap'
import MapFilters from '@/components/map/MapFilters'
import { fetchCities } from '@/services/authService'
import { useEffect } from 'react'

export default function MapPage() {
  const { user, cityId: userCityId, isAdmin, profile } = useAuth()

  const [cities, setCities]           = useState([])
  const [selectedCityId, setSelectedCity] = useState(null)
  const [filters, setFilters]         = useState({ status: null, category: null })

  // Logged-in citizens/admins default to their registered city
  useEffect(() => {
    if (userCityId) setSelectedCity(userCityId)
  }, [userCityId])

  // Load cities for the public dropdown
  useEffect(() => {
    fetchCities().then(setCities).catch(console.error)
  }, [])

  // Build filter object (only include non-null values)
  const activeFilters = useMemo(() => {
    const f = {}
    if (filters.status)   f.status   = filters.status
    if (filters.category) f.category = filters.category
    return f
  }, [filters.status, filters.category])

  const { issues, loading, error } = useIssues(selectedCityId, activeFilters)

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ status: null, category: null })
  }

  // Find slug of selected city (for map fly-to)
  const selectedCitySlug = cities.find(c => c.id === selectedCityId)?.slug ?? null

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Leaflet map — full screen behind everything */}
      {!loading && !error && (
        <LeafletMap
          issues={issues}
          selectedCitySlug={selectedCitySlug}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm">Loading issues…</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center gap-3 text-gray-500 text-center px-4">
            <WifiOff className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium text-gray-700">Failed to load issues</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        </div>
      )}

      {/* Filters panel — top left */}
      <MapFilters
        cities={cities}
        selectedCity={selectedCityId}
        onCityChange={setSelectedCity}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        issueCount={issues.length}
      />

      {/* Citizen: Report button — bottom right */}
      {user && !isAdmin && (
        <div className="absolute bottom-6 right-4 z-[400]">
          <Link
            to="/report"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 
                       text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg
                       transition-colors"
          >
            <Plus className="w-5 h-5" />
            Report Issue
          </Link>
        </div>
      )}

      {/* Unauthenticated nudge — bottom right */}
      {!user && (
        <div className="absolute bottom-6 right-4 z-[400]">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200
                       text-gray-700 font-medium text-sm px-4 py-2.5 rounded-full shadow-md
                       transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Sign up to report issues
          </Link>
        </div>
      )}

      {/* No city selected nudge */}
      {!selectedCityId && !loading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400]">
          <div className="bg-white/95 backdrop-blur-sm text-gray-600 text-xs 
                          px-4 py-2 rounded-full shadow border border-gray-200">
            Select a city from the filter panel to see issues
          </div>
        </div>
      )}
    </div>
  )
}
