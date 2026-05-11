// src/pages/AdminPage.jsx
// Admin dashboard — city-scoped issue management.
// Stats cards + filterable/searchable issues table.

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Search, SlidersHorizontal,
  Loader2, RefreshCw, AlertCircle, X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAdminIssues, fetchAdminStats } from '@/services/adminService'
import StatsCards from '@/components/admin/StatsCards'
import IssueRow from '@/components/admin/IssueRow'
import { ISSUE_STATUS, ISSUE_CATEGORY, SEVERITY, STATUS_LABELS } from '@/lib/constants'

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'upvotes',  label: 'Most upvoted' },
  { value: 'severity', label: 'Highest severity' },
]

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, null: 3 }

function sortIssues(issues, sortBy) {
  const copy = [...issues]
  switch (sortBy) {
    case 'oldest':   return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    case 'upvotes':  return copy.sort((a, b) => b.upvotes_count - a.upvotes_count)
    case 'severity': return copy.sort((a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
    case 'newest':
    default:         return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
}

export default function AdminPage() {
  const { cityId, city, profile } = useAuth()

  const [issues, setIssues]       = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState('newest')
  const [filters, setFilters]     = useState({
    status:      null,
    category:    null,
    severity:    null,
    showDeleted: false,
  })

  const load = useCallback(async () => {
    if (!cityId) return
    setLoading(true)
    setError(null)
    try {
      const [issueData, statsData] = await Promise.all([
        fetchAdminIssues(cityId, { ...filters, search }),
        fetchAdminStats(cityId),
      ])
      setIssues(issueData)
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cityId, filters, search])

  // Debounce search — don't hit DB on every keystroke
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({ status: null, category: null, severity: null, showDeleted: false })
    setSearch('')
  }

  const hasActiveFilters = filters.status || filters.category ||
                           filters.severity || filters.showDeleted || search

  const sorted = sortIssues(issues, sortBy)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500">
              {city?.name ?? 'Your city'} · {profile?.full_name}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <StatsCards stats={stats} />

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
          <div className="flex items-center gap-3 p-4">

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issue descriptions…"
                className="input pl-9 py-2 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input w-44 text-sm py-2"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(s => !s)}
              className={`btn-secondary text-sm py-2 relative ${showFilters ? 'border-indigo-300 text-indigo-700' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white 
                                 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">
                Clear all
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="border-t border-gray-100 px-4 py-4 flex flex-wrap gap-4">

              {/* Status */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.values(ISSUE_STATUS).map(s => (
                    <button key={s} onClick={() => setFilter('status', filters.status === s ? null : s)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                        ${filters.status === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Category</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.values(ISSUE_CATEGORY).map(c => (
                    <button key={c} onClick={() => setFilter('category', filters.category === c ? null : c)}
                      className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors
                        ${filters.category === c
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Severity</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.values(SEVERITY).map(s => (
                    <button key={s} onClick={() => setFilter('severity', filters.severity === s ? null : s)}
                      className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors
                        ${filters.severity === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show deleted */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showDeleted}
                    onChange={e => setFilter('showDeleted', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-xs text-gray-600">Show deleted issues</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Issues table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 border-b border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading issues…</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400 text-sm font-medium">No issues found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-indigo-600 mt-2 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Table */}
          {!loading && sorted.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['', 'Issue', 'Category', 'Severity', 'Status', 'Upvotes', 'Reported', 'Resolved in', 'Actions']
                      .map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 
                                               uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(issue => (
                    <IssueRow key={issue.id} issue={issue} onUpdated={load} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer row count */}
          {!loading && sorted.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {sorted.length} issue{sorted.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
