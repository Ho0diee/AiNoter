/* Seed script
 * Creates storage buckets (if absent), uploads 6 templates, and ensures the "Low-Token Jam" exists.
 */
import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import path from "node:path"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const supabase = createClient(url, service, { auth: { persistSession: false } })

async function ensureBuckets() {
  for (const b of ["thumbs","game_zips","promptscripts"]) {
    const { data, error } = await supabase.storage.getBucket(b)
    if (error) {
      await supabase.storage.createBucket(b, { public: b !== "game_zips" })
      console.log("Created bucket", b)
    }
  }
}

const templates = [
  "dating-sim","escape-room","boss-rush","murder-mystery","incremental-clicker","trivia"
]

function templateScript(name: string) {
  return {
    meta: { title: `${name} template`, ageRating: "E", tags: [name] },
    inputs: [],
    flow: [ { id:"start", type:"scene", prompt:`You are playing a ${name}.`, maxOutTokens: 50 } ],
    model: { name: "stub-model", temperature: 0.7 },
    budget: { maxCallsTotal: 6, maxTokensTotal: 1200 }
  }
}

async function uploadText(bucket: string, key: string, text: string) {
  const { error } = await supabase.storage.from(bucket).upload(key, new Blob([text], { type: "application/json" }), { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(key)
  return data.publicUrl
}

async function main() {
  await ensureBuckets()

  // Ensure jam exists
  await supabase.from("jams").upsert({
    title: "Low-Token Jam",
    slug: "low-token-jam",
    theme: "Make fun with ≤2000 tokens",
    rules_md: "Keep it tight. No NSFW.",
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 14*86400000).toISOString(),
    prize_pool_cents: 0
  }, { onConflict: "slug" })

  // Upload templates
  for (const t of templates) {
    const key = `templates/${t}/PromptScript.json`
    const url = await uploadText("promptscripts", key, JSON.stringify(templateScript(t)))
    // create game rows in draft
    await supabase.from("games").upsert({
      title: `${t} template`,
      slug: `${t}-template`,
      summary: `A starter ${t} PromptScript.`,
      tags: [t],
      age_rating: "E",
      thumb_url: null,
      status: "public"
    }, { onConflict: "slug" })
  }

  console.log("Seed complete")
}

main().catch((e) => { console.error(e); process.exit(1) })
