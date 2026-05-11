// src/pages/IssueDetailPage.jsx
// Full issue detail — image, description, location mini-map, upvote button.

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import {
  ArrowLeft, ThumbsUp, Calendar, MapPin,
  Loader2, AlertCircle, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { fetchIssueById, toggleUpvote, checkUserUpvote } from '@/services/issueService'
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge'
import { MARKER_COLORS } from '@/lib/constants'
import 'leaflet/dist/leaflet.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function timeSince(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function IssueDetailPage() {
  const { id }           = useParams()
  const { user, isAdmin } = useAuth()

  const [issue, setIssue]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [upvoted, setUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchIssueById(id)
        setIssue(data)
        setUpvoteCount(data.upvotes_count)
        if (user) {
          const hasVoted = await checkUserUpvote(id, user.id)
          setUpvoted(hasVoted)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  async function handleUpvote() {
    if (!user) { toast.error('Please sign in to upvote.'); return }
    if (isAdmin) { toast.error('Admins cannot upvote issues.'); return }

    setUpvoting(true)
    try {
      const { upvoted: newState } = await toggleUpvote(id, user.id)
      setUpvoted(newState)
      setUpvoteCount(c => newState ? c + 1 : c - 1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpvoting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
    </div>
  )

  if (error || !issue) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-gray-700 font-medium">Issue not found</p>
      <p className="text-gray-400 text-sm">{error}</p>
      <Link to="/" className="btn-primary mt-2">Back to Map</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 
                                 hover:text-gray-700 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to map
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Issue image */}
          {issue.image_url && (
            <img
              src={issue.image_url}
              alt="Issue"
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-6 space-y-5">

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={issue.status} />
              {issue.severity && <SeverityBadge severity={issue.severity} />}
              {issue.category && (
                <span className="badge bg-gray-100 text-gray-600 border-gray-200 capitalize">
                  {issue.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {issue.title || issue.description.slice(0, 80)}
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {issue.description}
            </p>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
                <span>Reported {timeSince(issue.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                <span>{issue.cities?.name ?? 'Unknown city'}</span>
              </div>
              {issue.resolved_at && (
                <div className="flex items-center gap-2 text-emerald-600 col-span-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Resolved on {formatDate(issue.resolved_at)}</span>
                </div>
              )}
            </div>

            {/* Upvote button */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={handleUpvote}
                disabled={upvoting || isAdmin}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  transition-all border
                  ${upvoted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {upvoting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ThumbsUp className={`w-4 h-4 ${upvoted ? 'fill-emerald-500' : ''}`} />
                }
                <span>{upvoteCount}</span>
                <span>{upvoted ? 'Upvoted' : 'Upvote'}</span>
              </button>
              {!user && (
                <Link to="/login" className="text-xs text-gray-400 hover:text-emerald-600">
                  Sign in to upvote
                </Link>
              )}
            </div>

            {/* Mini map */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Location
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 200 }}>
                <MapContainer
                  center={[issue.latitude, issue.longitude]}
                  zoom={15}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution=""
                  />
                  <CircleMarker
                    center={[issue.latitude, issue.longitude]}
                    radius={10}
                    pathOptions={{
                      color:       MARKER_COLORS[issue.status] ?? '#6B7280',
                      fillColor:   MARKER_COLORS[issue.status] ?? '#6B7280',
                      fillOpacity: 0.85,
                      weight:      2,
                    }}
                  />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 font-mono">
                {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
