"use server"

import { supabaseServer } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import crypto from "node:crypto"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

async function getUserOrThrow() {
  const sb = supabaseServer()
  const { data: { user }, error } = await sb.auth.getUser()
  if (error) throw new Error(error.message)
  if (!user) throw new Error("Unauthorized")
  return { sb, user }
}

export async function createGame(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const title = String(formData.get("title"))
  const summary = String(formData.get("summary"))
  const age_rating = String(formData.get("age_rating"))
  const tags = JSON.parse(String(formData.get("tags") ?? "[]")) as string[]
  const thumb_url = formData.get("thumb_url") ? String(formData.get("thumb_url")) : null
  if (!title || !summary) throw new Error("Missing fields")

  const slug = slugify(title) + "-" + crypto.randomBytes(3).toString("hex")
  const { data, error } = await sb.from("games").insert({
    owner_id: user.id, title, slug, summary, tags, age_rating, thumb_url, status: "draft"
  }).select().single()
  if (error) throw new Error(error.message)

  revalidatePath(`/game/${data.slug}`)
  return data
}

export async function uploadVersion(formData: FormData) {
  const { sb } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const version = String(formData.get("version") ?? "0.1.0")
  const zip_url = String(formData.get("zip_url"))
  const { data, error } = await sb.from("game_versions").insert({
    game_id, version, promptscript_url: zip_url, assets_zip_url: zip_url, model_lock: "stub-model", seed: 42, notes: "uploaded"
  }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath(`/game/${game_id}`)
  return data
}

export async function publishGame(formData: FormData) {
  const { sb } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const { data: game, error: e1 } = await sb.from("games").select("*").eq("id", game_id).single()
  if (e1 || !game) throw new Error(e1?.message || "Not found")
  const { error } = await sb.from("games").update({ status: "public" }).eq("id", game_id)
  if (error) throw new Error(error.message)
  revalidatePath(`/game/${game.slug}`)
  return { ok: true }
}

export async function recordPlayStart(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const version_id = String(formData.get("version_id"))
  const { data, error } = await sb.from("plays").insert({
    game_id, version_id, user_id: user.id, duration_sec: 0, completed: false, cost_tokens: 0
  }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function recordPlayEnd(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const play_id = String(formData.get("play_id"))
  const duration_sec = Number(formData.get("duration_sec"))
  const completed = String(formData.get("completed")) === "true"
  const cost_tokens = Number(formData.get("cost_tokens"))
  const { error } = await sb.from("plays").update({
    duration_sec, completed, cost_tokens
  }).eq("id", play_id).eq("user_id", user.id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function rateGame(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const score = Number(formData.get("score"))
  const review = String(formData.get("review") ?? "")
  const { error } = await sb.from("ratings").insert({ game_id, user_id: user.id, score, review })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function reportGame(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const reason = String(formData.get("reason"))
  const { error } = await sb.from("reports").insert({ game_id, reporter_id: user.id, reason })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function submitToJam(formData: FormData) {
  const { sb, user } = await getUserOrThrow()
  const jam_id = String(formData.get("jam_id"))
  const game_id = String(formData.get("game_id"))
  const notes = String(formData.get("notes") ?? "")
  const { error } = await sb.from("jam_submissions").insert({ jam_id, game_id, submitter_id: user.id, notes })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function adminResolveReport(formData: FormData) {
  const { sb } = await getUserOrThrow()
  const id = String(formData.get("report_id"))
  const { error } = await sb.from("reports").update({ resolved: true }).eq("id", id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function adminFeature(formData: FormData) {
  const { sb } = await getUserOrThrow()
  const game_id = String(formData.get("game_id"))
  const placement = String(formData.get("placement"))
  const starts_at = String(formData.get("starts_at"))
  const ends_at = String(formData.get("ends_at"))
  const { error } = await sb.from("promotions").insert({ game_id, placement, starts_at, ends_at })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function createJam(formData: FormData) {
  const { sb } = await getUserOrThrow()
  const title = String(formData.get("title"))
  const theme = String(formData.get("theme"))
  const rules_md = String(formData.get("rules_md"))
  const starts_at = new Date(String(formData.get("starts_at") ?? new Date().toISOString()))
  const ends_at = new Date(String(formData.get("ends_at") ?? new Date(Date.now()+7*864e5).toISOString()))
  const slug = slugify(title)
  const { error } = await sb.from("jams").insert({ title, slug, theme, rules_md, starts_at, ends_at, prize_pool_cents: 0 })
  if (error) throw new Error(error.message)
  return { ok: true }
}
