// src/components/ui/Badge.jsx
// Reusable status and severity badge components.

import { clsx } from 'clsx'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  SEVERITY_COLORS,
} from '@/lib/constants'

export function StatusBadge({ status, className }) {
  if (!status) return null
  return (
    <span className={clsx('badge', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600', className)}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function SeverityBadge({ severity, className }) {
  if (!severity) return null
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      SEVERITY_COLORS[severity] ?? 'bg-gray-100 text-gray-600',
      className
    )}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}
