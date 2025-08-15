import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

// Config
const PORT = Number(process.env.PORT || 8787)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

// OpenAI client (constructed lazily to avoid creating with empty key)
const getOpenAI = () => new OpenAI({ apiKey: OPENAI_API_KEY })

// Basic logger middleware (safe)
const logger = (req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now()
  // Only log on finish to include status and elapsed
  _res.on('finish', () => {
    const elapsed = Date.now() - start
    // Truncate any body fields if present (avoid logging prompts or keys)
    const route = req.path
  const ok = _res.statusCode < 400
  console.info(`[api] ${route} ${ok ? 'ok' : 'error'} status=${_res.statusCode} model=${OPENAI_MODEL} ${elapsed}ms`)
  })
  next()
}

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(logger)

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(OPENAI_API_KEY)
  const hasModel = Boolean(OPENAI_MODEL)
  const ok = hasKey && hasModel
  if (!ok) {
    // 503 to indicate service unavailable
    return res.status(503).json({ ok, hasKey, model: OPENAI_MODEL })
  }
  return res.json({ ok, hasKey, model: OPENAI_MODEL })
})

// Helpers
const mapOpenAIError = (err: any) => {
  const status = err?.status || err?.response?.status
  if (status === 401 || status === 403) {
    return { http: 401, body: { code: 'KEY_INVALID', message: 'API key missing or invalid' } }
  }
  if (status === 429) {
    return { http: 429, body: { code: 'RATE_LIMIT', message: 'Rate limit or quota; retry later' } }
  }
  return { http: 500, body: { code: 'SERVER_ERROR', message: 'Unexpected error' } }
}

// POST /api/plan
// Input: { ideaText: string, failureTags?: string[], heuristics?: string[] }
// Output: PlanResponse -> { plan: string, checklist: { id: string, label: string }[] }
app.post('/api/plan', async (req: Request, res: Response) => {
  if (!OPENAI_API_KEY) {
    return res.status(401).json({ code: 'KEY_INVALID', message: 'API key missing or invalid' })
  }
  const { ideaText, failureTags = [], heuristics = [] } = req.body || {}
  if (!ideaText || typeof ideaText !== 'string') {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'ideaText is required' })
  }
  try {
    const client = getOpenAI()

    const system = 'You are an assistant that turns a product idea into a concise implementation plan and a short checklist of concrete steps. Keep it terse and actionable.'
    const user = `Idea:\n${ideaText}\n\nConsider known pitfalls: ${failureTags.slice(0, 8).join(', ') || 'none'}.\nHeuristics to apply: ${heuristics.slice(0, 8).join(', ') || 'none'}.\nReturn strict JSON with fields: plan (string), checklist (array of items {id,label}). Keep checklist between 4 and 8 items.`

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })

    const text = completion.choices[0]?.message?.content || '{}'
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { plan: 'Unable to parse plan', checklist: [] }
    }

    // Enforce exact shape
    const plan = typeof data.plan === 'string' ? data.plan : ''
    const checklistRaw = Array.isArray(data.checklist) ? data.checklist : []
    const checklist = checklistRaw
      .map((it: any, idx: number) => ({
        id: String(it?.id ?? idx + 1),
        label: String(it?.label ?? '')
      }))
      .filter((it: any) => it.label)

    return res.json({ plan, checklist })
  } catch (err: any) {
    const mapped = mapOpenAIError(err)
    return res.status(mapped.http).json(mapped.body)
  }
})

// POST /api/refine
// Input: { failedSteps: {id:string,label:string,reason:string}[], lastPrompt: string, fileTree?: any, snippets?: any }
// Output: RefinePromptResponse -> { updated_prompt: string, reasons_for_changes: string[], additional_checks: string[] }
app.post('/api/refine', async (req: Request, res: Response) => {
  if (!OPENAI_API_KEY) {
    return res.status(401).json({ code: 'KEY_INVALID', message: 'API key missing or invalid' })
  }
  const { failedSteps = [], lastPrompt = '', fileTree, snippets } = req.body || {}
  if (typeof lastPrompt !== 'string') {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'lastPrompt must be a string' })
  }
  try {
    const client = getOpenAI()

    const system = 'You improve a coding prompt based on failed steps and context. Output strict JSON with fields: updated_prompt (string), reasons_for_changes (array of strings), additional_checks (array of strings). Keep concise.'
    const truncated = (s: string, n = 1200) => (s && s.length > n ? s.slice(0, n) + '…' : s)
    const user = {
      failedSteps: (Array.isArray(failedSteps) ? failedSteps : []).slice(0, 12).map((s: any) => ({ id: String(s?.id ?? ''), label: String(s?.label ?? ''), reason: String(s?.reason ?? '') })),
      lastPrompt: truncated(lastPrompt, 4000),
      fileTree: fileTree ? '[omitted for brevity]' : undefined,
      snippets: snippets ? '[omitted for brevity]' : undefined
    }

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(user) }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const text = completion.choices[0]?.message?.content || '{}'
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { updated_prompt: lastPrompt, reasons_for_changes: [], additional_checks: [] }
    }
    const updated_prompt = typeof data.updated_prompt === 'string' ? data.updated_prompt : lastPrompt
    const reasons_for_changes = Array.isArray(data.reasons_for_changes) ? data.reasons_for_changes.map((s: any) => String(s)).filter(Boolean) : []
    const additional_checks = Array.isArray(data.additional_checks) ? data.additional_checks.map((s: any) => String(s)).filter(Boolean) : []
    return res.json({ updated_prompt, reasons_for_changes, additional_checks })
  } catch (err: any) {
    const mapped = mapOpenAIError(err)
    return res.status(mapped.http).json(mapped.body)
  }
})

// POST /api/quick-edit (optional)
// Accepts: { selection: string, intent: string }
// Returns: { patch_prompt: string }
app.post('/api/quick-edit', async (req: Request, res: Response) => {
  if (!OPENAI_API_KEY) {
    return res.status(401).json({ code: 'KEY_INVALID', message: 'API key missing or invalid' })
  }
  const { selection = '', intent = '' } = req.body || {}
  if (!selection || !intent) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'selection and intent are required' })
  }
  try {
    const client = getOpenAI()
    const system = 'You generate a tiny patch instruction for code editors. Output JSON { patch_prompt: string } only.'
    const user = `Selection:\n${selection.slice(0, 1200)}\nIntent: ${intent.slice(0, 200)}`
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })
    const text = completion.choices[0]?.message?.content || '{}'
    let data: any
    try { data = JSON.parse(text) } catch { data = {} }
    const patch_prompt = typeof data.patch_prompt === 'string' ? data.patch_prompt : `Edit the selection to satisfy: ${intent}`
    return res.json({ patch_prompt })
  } catch (err: any) {
    const mapped = mapOpenAIError(err)
    return res.status(mapped.http).json(mapped.body)
  }
})

// Startup validation
if (!OPENAI_API_KEY) {
  console.error('[api] OPENAI_API_KEY is missing or empty. /api/health will report unavailable until set.')
}
if (!OPENAI_MODEL) {
  console.error('[api] OPENAI_MODEL is missing or empty. Using default fallback, but health will fail until set.')
}

app.listen(PORT, () => {
  console.log(`[api] server listening on http://localhost:${PORT}`)
})
