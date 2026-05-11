// src/components/map/MapFilters.jsx
// Filter panel for the public map — city, status, category.

import { Filter, X } from 'lucide-react'
import { ISSUE_STATUS, ISSUE_CATEGORY, STATUS_LABELS } from '@/lib/constants'

const CATEGORIES = Object.values(ISSUE_CATEGORY)
const STATUSES   = Object.values(ISSUE_STATUS)

export default function MapFilters({
  cities,
  selectedCity,
  onCityChange,
  filters,
  onFilterChange,
  onClearFilters,
  issueCount,
}) {
  const hasActiveFilters = filters.status || filters.category

  return (
    <div className="absolute top-3 left-3 z-[400] w-64">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">

          {/* City selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              City
            </label>
            <select
              value={selectedCity ?? ''}
              onChange={e => onCityChange(e.target.value || null)}
              className="input text-sm py-1.5"
            >
              <option value="">All cities</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <div className="flex flex-col gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => onFilterChange('status', filters.status === s ? null : s)}
                  className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors
                    ${filters.status === s
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => onFilterChange('category', filters.category === c ? null : c)}
                  className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors
                    ${filters.category === c
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Issue count */}
          <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
            {issueCount} issue{issueCount !== 1 ? 's' : ''} shown
          </p>
        </div>
      </div>
    </div>
  )
}
