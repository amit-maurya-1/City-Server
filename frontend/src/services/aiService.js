// src/services/aiService.js
// ALL Claude API calls now go through our Supabase Edge Function.
// The Anthropic API key never touches the frontend bundle.

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL

async function callEdgeFunction(action, payload) {
  const res = await fetch(`${FUNCTIONS_URL}/analyze-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })

  if (!res.ok) throw new Error(`Edge Function error: ${res.status}`)

  const json = await res.json()
  // Edge function returns { data } on success, { data: null, warning } on AI failure
  return json.data  // null if Claude was down — caller handles gracefully
}

// ─── Categorize + severity + title from description ────────────────────────
// Returns: { category, severity, title } or null if Claude was down
export async function analyzeIssue(description) {
  try {
    return await callEdgeFunction('analyze', { description })
  } catch (err) {
    console.warn('AI analyze failed (non-blocking):', err.message)
    return null
  }
}

// ─── Semantic duplicate check on geo-filtered candidates ──────────────────
// Returns: { isDuplicate, matchedIssueId, reason } or no-duplicate on failure
export async function detectDuplicate(description, candidates) {
  if (!candidates?.length) {
    return { isDuplicate: false, matchedIssueId: null, reason: '' }
  }
  try {
    const result = await callEdgeFunction('detectDuplicate', { description, candidates })
    return result ?? { isDuplicate: false, matchedIssueId: null, reason: '' }
  } catch (err) {
    console.warn('AI duplicate check failed (non-blocking):', err.message)
    return { isDuplicate: false, matchedIssueId: null, reason: '' }
  }
}
