// src/components/admin/IssueRow.jsx
// Single row in the admin issues table.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, RotateCcw, ExternalLink, ThumbsUp, Clock } from 'lucide-react'
import { SeverityBadge } from '@/components/ui/Badge'
import StatusDropdown from './StatusDropdown'
import { softDeleteIssue, restoreIssue } from '@/services/adminService'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function resolutionTime(createdAt, resolvedAt) {
  if (!resolvedAt) return null
  const diffMs   = new Date(resolvedAt) - new Date(createdAt)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHrs  = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (diffDays > 0) return `${diffDays}d ${diffHrs}h`
  return `${diffHrs}h`
}

export default function IssueRow({ issue, onUpdated }) {
  const [currentIssue, setCurrentIssue] = useState(issue)
  const [deleting, setDeleting]         = useState(false)
  const isDeleted = Boolean(currentIssue.deleted_at)

  async function handleDelete() {
    if (!confirm('Mark this issue as deleted?')) return
    setDeleting(true)
    try {
      await softDeleteIssue(currentIssue.id)
      setCurrentIssue(p => ({ ...p, deleted_at: new Date().toISOString() }))
      toast.success('Issue deleted')
      onUpdated?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore() {
    setDeleting(true)
    try {
      await restoreIssue(currentIssue.id)
      setCurrentIssue(p => ({ ...p, deleted_at: null }))
      toast.success('Issue restored')
      onUpdated?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleStatusUpdated(updated) {
    setCurrentIssue(p => ({ ...p, status: updated.status, resolved_at: updated.resolved_at }))
    onUpdated?.()
  }

  const resolution = resolutionTime(currentIssue.created_at, currentIssue.resolved_at)

  return (
    <tr className={clsx(
      'border-b border-gray-100 hover:bg-gray-50 transition-colors',
      isDeleted && 'opacity-50 bg-red-50'
    )}>
      {/* Image thumbnail */}
      <td className="px-4 py-3 w-14">
        {currentIssue.image_url
          ? <img src={currentIssue.image_url} alt=""
              className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-gray-300 text-xs">—</span>
            </div>
        }
      </td>

      {/* Description */}
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-gray-800 font-medium line-clamp-1">
          {currentIssue.title || currentIssue.description.slice(0, 60)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
          {currentIssue.description}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          by {currentIssue.profiles?.full_name ?? 'Unknown'}
        </p>
      </td>

      {/* Category */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
          {currentIssue.category ?? '—'}
        </span>
      </td>

      {/* Severity */}
      <td className="px-4 py-3 whitespace-nowrap">
        <SeverityBadge severity={currentIssue.severity} />
      </td>

      {/* Status dropdown */}
      <td className="px-4 py-3 whitespace-nowrap">
        {!isDeleted
          ? <StatusDropdown
              issueId={currentIssue.id}
              currentStatus={currentIssue.status}
              onUpdated={handleStatusUpdated}
            />
          : <span className="text-xs text-red-400 font-medium">Deleted</span>
        }
      </td>

      {/* Upvotes */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <ThumbsUp className="w-3 h-3" />
          {currentIssue.upvotes_count}
        </span>
      </td>

      {/* Reported time */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
        {timeAgo(currentIssue.created_at)}
      </td>

      {/* Resolution time */}
      <td className="px-4 py-3 whitespace-nowrap">
        {resolution
          ? <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Clock className="w-3 h-3" />
              {resolution}
            </span>
          : <span className="text-xs text-gray-300">—</span>
        }
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Link
            to={`/issues/${currentIssue.id}`}
            target="_blank"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                       rounded-lg transition-colors"
            title="View"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {isDeleted ? (
            <button
              onClick={handleRestore}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 
                         rounded-lg transition-colors"
              title="Restore"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 
                         rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
