// src/components/map/IssuePopup.jsx
// Rendered inside a Leaflet popup when a marker is clicked.
// Kept lightweight — full details are on /issues/:id

import { Link } from 'react-router-dom'
import { ArrowRight, ThumbsUp, Calendar } from 'lucide-react'
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function IssuePopup({ issue }) {
  return (
    <div className="w-64 font-sans">
      {/* Image */}
      {issue.image_url && (
        <img
          src={issue.image_url}
          alt="Issue"
          className="w-full h-32 object-cover"
          loading="lazy"
        />
      )}

      <div className="p-3 space-y-2">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={issue.status} />
          {issue.severity && <SeverityBadge severity={issue.severity} />}
          {issue.category && (
            <span className="badge bg-gray-100 text-gray-600 border-gray-200 capitalize">
              {issue.category}
            </span>
          )}
        </div>

        {/* Title / description */}
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
          {issue.title || issue.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(issue.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {issue.upvotes_count}
          </span>
        </div>

        {/* View full detail */}
        <Link
          to={`/issues/${issue.id}`}
          className="flex items-center justify-between w-full text-xs font-medium 
                     text-emerald-700 hover:text-emerald-800 bg-emerald-50 
                     hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors"
        >
          View full report
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
