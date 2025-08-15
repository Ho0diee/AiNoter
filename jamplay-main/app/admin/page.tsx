import { supabaseServer } from "@/lib/supabase-server"
import { adminFeature, adminResolveReport, createJam } from "@/app/server-actions"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
  const supabase = supabaseServer()
  const [{ data: reports }, { data: games }] = await Promise.all([
    supabase.from("reports").select("*").eq("resolved", false).limit(50),
    supabase.from("games").select("*").eq("status","public").limit(50)
  ])

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-semibold mb-2">Reports</h2>
        <div className="space-y-3">
          {(reports ?? []).map((r:any) => (
            <form key={r.id} action={adminResolveReport} className="rounded border p-3 space-y-1">
              <div className="text-sm">Game: {r.game_id}</div>
              <div className="text-sm text-neutral-700">Reason: {r.reason}</div>
              <input type="hidden" name="report_id" value={r.id}/>
              <Button size="sm">Resolve</Button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Feature / Promotions</h2>
        <div className="space-y-3">
          <form action={createJam} className="rounded border p-3 space-y-2">
            <div className="font-medium">Create Jam</div>
            <input className="border rounded px-2 py-1 text-sm w-full" name="title" placeholder="Title"/>
            <input className="border rounded px-2 py-1 text-sm w-full" name="theme" placeholder="Theme"/>
            <input className="border rounded px-2 py-1 text-sm w-full" name="rules_md" placeholder="Rules (md)"/>
            <input className="border rounded px-2 py-1 text-sm w-full" name="starts_at" placeholder="YYYY-MM-DD"/>
            <input className="border rounded px-2 py-1 text-sm w-full" name="ends_at" placeholder="YYYY-MM-DD"/>
            <Button size="sm">Create</Button>
          </form>
        </div>
      </section>
    </div>
  )
}
