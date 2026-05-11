// src/components/admin/StatusDropdown.jsx
// Inline status updater for each issue row in the admin table.

import { useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { ISSUE_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { updateIssueStatus } from '@/services/adminService'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STATUS_ORDER = [
  ISSUE_STATUS.REPORTED,
  ISSUE_STATUS.VERIFIED,
  ISSUE_STATUS.IN_PROGRESS,
  ISSUE_STATUS.RESOLVED,
]

export default function StatusDropdown({ issueId, currentStatus, onUpdated }) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSelect(newStatus) {
    if (newStatus === currentStatus) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const updated = await updateIssueStatus(issueId, newStatus)
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`)
      onUpdated?.(updated)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={clsx(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg',
          'border transition-colors cursor-pointer',
          STATUS_COLORS[currentStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200'
        )}
      >
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : STATUS_LABELS[currentStatus]
        }
        {!loading && <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border 
                          border-gray-200 shadow-lg overflow-hidden w-36">
            {STATUS_ORDER.map(status => (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={clsx(
                  'w-full text-left text-xs px-3 py-2 transition-colors',
                  status === currentStatus
                    ? 'bg-gray-50 font-semibold text-gray-700'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {STATUS_LABELS[status]}
                {status === currentStatus && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
