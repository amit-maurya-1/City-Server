// src/components/issues/DuplicateWarning.jsx
// Shown when AI detects a possible duplicate issue nearby.

import { AlertTriangle, ExternalLink, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DuplicateWarning({ duplicate, onSubmitAnyway, onDismiss, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in">

        {/* Icon + heading */}
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Similar issue already reported</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {duplicate.reason || 'An existing report nearby may describe the same problem.'}
            </p>
          </div>
        </div>

        {/* Link to existing issue */}
        {duplicate.matchedIssueId && (
          <Link
            to={`/issues/${duplicate.matchedIssueId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 w-full border border-amber-200 
                       bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium 
                       px-4 py-3 rounded-xl transition-colors mb-5"
          >
            <span>View existing report</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </Link>
        )}

        <p className="text-xs text-gray-400 mb-5">
          You can upvote the existing issue to show it needs attention, or submit a new report
          if you believe it describes a different problem.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onSubmitAnyway}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 
                       hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium 
                       text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {loading
              ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              : <Send className="w-4 h-4" />
            }
            {loading ? 'Submitting…' : 'Report Anyway'}
          </button>
        </div>

      </div>
    </div>
  )
}
