import { z } from "zod"

export const AgeRating = z.enum(["E","E10","Teen"])
export const GameStatus = z.enum(["draft","public","private","removed"])

export const PromptNode = z.object({
  id: z.string(),
  type: z.enum(["scene","choice","check","end"]),
  prompt: z.string().min(1),
  maxCalls: z.number().int().min(0).max(12).optional(),
  maxInTokens: z.number().int().min(0).max(2000).optional(),
  maxOutTokens: z.number().int().min(0).max(2000).optional(),
})

export const PromptScriptSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    ageRating: AgeRating,
    tags: z.array(z.string()).min(0).max(10)
  }),
  inputs: z.array(z.object({ key: z.string(), label: z.string() })).optional().default([]),
  flow: z.array(PromptNode).min(1),
  model: z.object({
    name: z.string(),
    temperature: z.number().min(0).max(2),
    seed: z.number().int().optional()
  }),
  budget: z.object({
    maxCallsTotal: z.number().int().max(12),
    maxTokensTotal: z.number().int().max(2000)
  })
})

export const CreateGameInput = z.object({
  title: z.string().min(2).max(80),
  summary: z.string().min(10).max(400),
  tags: z.array(z.string()).max(10),
  age_rating: AgeRating,
  thumb_url: z.string().url().optional()
})

export const UploadVersionInput = z.object({
  game_id: z.string().uuid(),
  zip_url: z.string().url()
})

export const PublishGameInput = z.object({
  game_id: z.string().uuid()
})

export type PromptScript = z.infer<typeof PromptScriptSchema>
