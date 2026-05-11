// supabase/functions/analyze-issue/index.ts
// Handles ALL Claude API calls server-side.
// Frontend never touches the Claude API key directly.
//
// Deploy: supabase functions deploy analyze-issue
// Secrets to set in Supabase Dashboard → Edge Functions → analyze-issue:
//   ANTHROPIC_API_KEY=sk-ant-...
//   SUPABASE_URL=https://your-project.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
const CLAUDE_MODEL   = "claude-sonnet-4-20250514"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ── Shared Claude caller ───────────────────────────────────────────────────
async function callClaude(system: string, userMessage: string, maxTokens = 256) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured.")

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content[0]?.text ?? ""
}

// ── Action: categorize + severity + title ─────────────────────────────────
async function analyzeIssue(description: string) {
  const system = `You are an AI assistant for a civic issue reporting platform.
Given a citizen's issue description, return ONLY a JSON object with these fields:
- category: one of "roads", "garbage", "water", "lighting", "encroachment", "other"
- severity: one of "low", "medium", "high"
- title: a short 5-8 word title summarizing the issue

Rules:
- severity "high" = safety risk, flooding, major road damage, exposed wires
- severity "medium" = significant inconvenience, recurring problem
- severity "low" = minor issue, aesthetic problem
- Return ONLY valid JSON. No markdown, no extra text.`

  const raw   = await callClaude(system, `Issue description: "${description}"`)
  const clean = raw.replace(/```json|```/g, "").trim()

  const parsed = JSON.parse(clean)
  const validCategories = ["roads","garbage","water","lighting","encroachment","other"]
  const validSeverities  = ["low","medium","high"]

  return {
    category: validCategories.includes(parsed.category) ? parsed.category : "other",
    severity:  validSeverities.includes(parsed.severity)  ? parsed.severity  : "medium",
    title:     typeof parsed.title === "string" ? parsed.title : null,
  }
}

// ── Action: semantic duplicate detection ──────────────────────────────────
async function detectDuplicate(newDescription: string, candidates: unknown[]) {
  if (!candidates?.length) {
    return { isDuplicate: false, matchedIssueId: null, reason: "" }
  }

  const system = `You are an AI assistant for a civic issue reporting platform.
Detect if a new report is a duplicate of existing reports.
Two issues are duplicates if they describe the SAME physical problem at the SAME location.
Similar category alone is NOT enough — the actual problem must be identical.
Return ONLY a JSON object:
- isDuplicate: boolean
- matchedIssueId: string (id of matching issue) or null
- reason: explanation in max 15 words
No markdown, no extra text.`

  const userMsg = `New report: "${newDescription}"

Nearby existing issues:
${JSON.stringify(candidates, null, 2)}`

  const raw    = await callClaude(system, userMsg, 128)
  const clean  = raw.replace(/```json|```/g, "").trim()
  const parsed = JSON.parse(clean)

  return {
    isDuplicate:    Boolean(parsed.isDuplicate),
    matchedIssueId: parsed.matchedIssueId ?? null,
    reason:         parsed.reason ?? "",
  }
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()

    if (!action || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing action or payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let result: unknown

    switch (action) {
      case "analyze":
        if (!payload.description) throw new Error("description is required.")
        result = await analyzeIssue(payload.description)
        break

      case "detectDuplicate":
        if (!payload.description || !payload.candidates) {
          throw new Error("description and candidates are required.")
        }
        result = await detectDuplicate(payload.description, payload.candidates)
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("Edge Function error:", err)

    // Return null data instead of 500 — Claude being down must not block submissions
    return new Response(
      JSON.stringify({ data: null, warning: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
