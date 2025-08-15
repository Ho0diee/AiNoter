import { supabaseServer } from "@/lib/supabase-server"
import { formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"

export default async function JamPage({ params }: { params: { slug: string }}) {
  const supabase = supabaseServer()
  const { data: jam } = await supabase.from("jams").select("*").eq("slug", params.slug).maybeSingle()
  if (!jam) return <div>Not found</div>
  const { data: subs } = await supabase.from("jam_submissions_view").select("*").eq("jam_id", jam.id).limit(100)

  const now = new Date()
  const inWindow = new Date(jam.starts_at) <= now && now <= new Date(jam.ends_at)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h1 className="text-2xl font-semibold">{jam.title}</h1>
        <p className="text-neutral-700">{jam.theme}</p>
        <div className="text-sm text-neutral-600">Ends in {formatDistanceToNowStrict(new Date(jam.ends_at))}</div>
        {inWindow && <Link className="inline-block underline text-sm mt-2" href="/create">Submit existing game</Link>}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Submissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(subs ?? []).map((s:any) => (
            <div key={s.id} className="rounded border p-3">
              <div className="font-medium">{s.game_title}</div>
              <Link className="text-sm underline" href={`/game/${s.game_slug}`}>Open</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
