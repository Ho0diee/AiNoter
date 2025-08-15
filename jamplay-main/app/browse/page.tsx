import { supabaseServer } from "@/lib/supabase-server"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"

export const dynamic = "force-dynamic"

async function search(params: { q?: string, tag?: string, age?: string, sort?: string }) {
  const supabase = supabaseServer()
  let q = supabase.from("games").select("*").eq("status","public")
  if (params.age) q = q.eq("age_rating", params.age)
  if (params.tag) q = q.contains("tags", [params.tag])
  if (params.sort === "new") q = q.order("created_at", { ascending: false })
  else if (params.sort === "trending") return (await supabase.from("trending_games").select("*").order("score", { ascending: false }).limit(50)).data
  return (await q.limit(50)).data
}

export default async function BrowsePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const rows = await search({
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    tag: typeof searchParams.tag === "string" ? searchParams.tag : undefined,
    age: typeof searchParams.age === "string" ? searchParams.age : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "trending",
  })
  return (
    <div className="space-y-4">
      <form className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input name="q" placeholder="Search (stub)" />
        <Select placeholder="Age">
          <SelectItem value="E">Everyone</SelectItem>
          <SelectItem value="E10">E10</SelectItem>
          <SelectItem value="Teen">Teen</SelectItem>
        </Select>
        <Input name="tag" placeholder="Tag e.g. mystery" />
        <Select placeholder="Sort">
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="new">New</SelectItem>
        </Select>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(rows ?? []).map((r: any) => (
          <div key={r.game_id ?? r.id} className="rounded border p-3">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-neutral-600 line-clamp-2">{r.summary}</div>
            <Link className="text-sm underline mt-2 inline-block" href={`/game/${r.slug}`}>Open</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
