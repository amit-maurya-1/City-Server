// src/services/adminService.js
// Admin-only operations. All queries are city-scoped via RLS —
// even if cityId is wrong, DB won't return other cities' data.

import { supabase } from '@/lib/supabase'
import { ISSUE_STATUS } from '@/lib/constants'

// ─── Fetch all issues for admin's city (including soft-deleted for audit) ──
export async function fetchAdminIssues(cityId, filters = {}) {
  let query = supabase
    .from('issues')
    .select(`
      id, title, description, category, severity, status,
      latitude, longitude, image_url, upvotes_count,
      created_at, updated_at, resolved_at, deleted_at,
      profiles:reported_by ( full_name )
    `)
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })

  // Admins see non-deleted by default; pass showDeleted:true to include them
  if (!filters.showDeleted) query = query.is('deleted_at', null)
  if (filters.status)       query = query.eq('status', filters.status)
  if (filters.category)     query = query.eq('category', filters.category)
  if (filters.severity)     query = query.eq('severity', filters.severity)
  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Update issue status ───────────────────────────────────────────────────
export async function updateIssueStatus(issueId, newStatus) {
  if (!Object.values(ISSUE_STATUS).includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`)
  }

  const { data, error } = await supabase
    .from('issues')
    .update({ status: newStatus })
    .eq('id', issueId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Soft-delete an issue (spam / false report) ────────────────────────────
export async function softDeleteIssue(issueId) {
  const { error } = await supabase
    .from('issues')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', issueId)

  if (error) throw new Error(error.message)
}

// ─── Restore a soft-deleted issue ─────────────────────────────────────────
export async function restoreIssue(issueId) {
  const { error } = await supabase
    .from('issues')
    .update({ deleted_at: null })
    .eq('id', issueId)

  if (error) throw new Error(error.message)
}

// ─── Dashboard stats for admin city ───────────────────────────────────────
export async function fetchAdminStats(cityId) {
  const { data, error } = await supabase
    .from('issues')
    .select('status, severity, created_at, resolved_at')
    .eq('city_id', cityId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  const issues = data ?? []
  const total  = issues.length

  const byStatus = {
    reported:    issues.filter(i => i.status === 'reported').length,
    verified:    issues.filter(i => i.status === 'verified').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved:    issues.filter(i => i.status === 'resolved').length,
  }

  const bySeverity = {
    high:   issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low:    issues.filter(i => i.severity === 'low').length,
  }

  // Average resolution time (only resolved issues with both timestamps)
  const resolved = issues.filter(i => i.resolved_at && i.created_at)
  const avgResolutionMs = resolved.length
    ? resolved.reduce((sum, i) => {
        return sum + (new Date(i.resolved_at) - new Date(i.created_at))
      }, 0) / resolved.length
    : null

  const avgResolutionDays = avgResolutionMs
    ? (avgResolutionMs / (1000 * 60 * 60 * 24)).toFixed(1)
    : null

  const resolutionRate = total > 0
    ? ((byStatus.resolved / total) * 100).toFixed(0)
    : 0

  return { total, byStatus, bySeverity, avgResolutionDays, resolutionRate }
}
