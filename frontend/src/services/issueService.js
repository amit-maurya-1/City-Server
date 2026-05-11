// src/services/issueService.js
// All issue-related DB operations. AI calls happen here too — not in components.

import { supabase } from '@/lib/supabase'
import { analyzeIssue, detectDuplicate } from '@/services/aiService'
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_ALLOWED_TYPES,
  REPORT_COOLDOWN_MS,
} from '@/lib/constants'

// ─── Validate image before upload ──────────────────────────────────────────
export function validateImage(file) {
  if (!file) return 'Please select an image.'
  if (!IMAGE_ALLOWED_TYPES.includes(file.type))
    return 'Only JPEG, PNG, and WebP images are allowed.'
  if (file.size > IMAGE_MAX_SIZE_BYTES)
    return 'Image must be under 5MB.'
  return null
}

// ─── Upload image to Supabase Storage ──────────────────────────────────────
async function uploadImage(file, userId) {
  const ext      = file.name.split('.').pop()
  const filename = `${userId}/${Date.now()}.${ext}`  // path: {userId}/{timestamp}.ext

  const { data, error } = await supabase.storage
    .from('issue-images')
    .upload(filename, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('issue-images')
    .getPublicUrl(data.path)

  return publicUrl
}

// ─── Check rate limit — 5 mins between reports ─────────────────────────────
async function checkRateLimit(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_reported_at')
    .eq('id', userId)
    .single()

  if (profile?.last_reported_at) {
    const lastTime = new Date(profile.last_reported_at).getTime()
    const elapsed  = Date.now() - lastTime
    if (elapsed < REPORT_COOLDOWN_MS) {
      const remaining = Math.ceil((REPORT_COOLDOWN_MS - elapsed) / 60000)
      throw new Error(`Please wait ${remaining} more minute(s) before submitting another report.`)
    }
  }
}

// ─── Fetch nearby issues (calls PostGIS function) ──────────────────────────
async function fetchNearbyIssues(cityId, lat, lng, category) {
  const { data, error } = await supabase.rpc('get_nearby_issues', {
    p_city_id:   cityId,
    p_latitude:  lat,
    p_longitude: lng,
    p_radius_m:  500,
    p_category:  category,
  })
  if (error) {
    console.warn('Nearby issues fetch failed:', error.message)
    return []
  }
  return data ?? []
}

// ─── Update last_reported_at after successful submission ───────────────────
async function updateLastReportedAt(userId) {
  await supabase
    .from('profiles')
    .update({ last_reported_at: new Date().toISOString() })
    .eq('id', userId)
}

// ─── MAIN: Submit a new issue ───────────────────────────────────────────────
// Returns: { issue, duplicate }
// duplicate = { isDuplicate, matchedIssueId, reason } | null
//
// FLOW:
// 1. Rate limit check
// 2. Image upload
// 3. AI: categorize + severity + title
// 4. Fetch nearby issues (PostGIS)
// 5. AI: semantic duplicate check
// 6. If duplicate → return without saving (let user decide)
// 7. Save issue
// 8. Update last_reported_at

export async function submitIssue({ description, image, lat, lng, cityId, userId, forceSubmit = false }) {
  // 1. Rate limit
  await checkRateLimit(userId)

  // 2. Image upload
  const imageError = validateImage(image)
  if (imageError) throw new Error(imageError)
  const imageUrl = await uploadImage(image, userId)

  // 3. AI analysis (non-blocking — null on failure)
  const analysis = await analyzeIssue(description)
  const { category, severity, title } = analysis ?? { category: null, severity: null, title: null }

  // 4 + 5. Duplicate detection (only if we have a category)
  let duplicateResult = null
  if (!forceSubmit && category) {
    const nearby = await fetchNearbyIssues(cityId, lat, lng, category)
    if (nearby.length > 0) {
      duplicateResult = await detectDuplicate(description, nearby)
      if (duplicateResult.isDuplicate) {
        // Return early — don't save yet, let UI show warning
        return { issue: null, duplicate: duplicateResult }
      }
    }
  }

  // 6. Save issue
  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      description,
      title,
      category,
      severity,
      status:      'reported',
      city_id:     cityId,
      reported_by: userId,
      latitude:    lat,
      longitude:   lng,
      image_url:   imageUrl,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save issue: ${error.message}`)

  // 7. Update rate limit timestamp
  await updateLastReportedAt(userId)

  return { issue, duplicate: null }
}

// ─── Fetch issues for map (city-scoped) ────────────────────────────────────
export async function fetchIssuesForCity(cityId, filters = {}) {
  let query = supabase
    .from('issues')
    .select('id, title, description, category, severity, status, latitude, longitude, upvotes_count, created_at, image_url')
    .eq('city_id', cityId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.status)   query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Fetch single issue (detail page) ─────────────────────────────────────
export async function fetchIssueById(issueId) {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      profiles:reported_by ( full_name ),
      cities:city_id ( name )
    `)
    .eq('id', issueId)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Toggle upvote ─────────────────────────────────────────────────────────
export async function toggleUpvote(issueId, userId) {
  // Check if already upvoted
  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('issue_id', issueId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Remove upvote
    await supabase.from('upvotes').delete().eq('id', existing.id)
    return { upvoted: false }
  } else {
    // Add upvote
    await supabase.from('upvotes').insert({ issue_id: issueId, user_id: userId })
    return { upvoted: true }
  }
}

// ─── Check if user has upvoted an issue ───────────────────────────────────
export async function checkUserUpvote(issueId, userId) {
  const { data } = await supabase
    .from('upvotes')
    .select('id')
    .eq('issue_id', issueId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(data)
}
