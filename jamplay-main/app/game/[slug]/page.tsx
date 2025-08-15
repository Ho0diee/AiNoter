import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameBySlug, getLatestPublishedVersion } from "@/lib/db";
import { recordPlayStart, recordPlayEnd, rateGame, reportGame } from "@/app/server-actions";

export default async function GamePage({ params }: { params: { slug: string }}) {
  const { data: game, error: gErr } = await getGameBySlug(params.slug);
  if (gErr) console.error("getGameBySlug error:", gErr);
  if (!game) return notFound();

  const { data: vLatest, error: vErr } = await getLatestPublishedVersion(game.id);
  if (vErr) console.error("getLatestPublishedVersion error:", vErr);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-3">
        <h1 className="text-2xl font-semibold">{game.title}</h1>
        <p className="text-neutral-600">{game.summary}</p>
        <div className="flex gap-2">
          <form action={recordPlayStart}>
            <input type="hidden" name="game_id" value={game.id} />
            <input type="hidden" name="version_id" value={vLatest?.id ?? ""} />
            <Button type="submit" disabled={!vLatest}>Play</Button>
          </form>
          <Button asChild variant="outline"><Link href={`/create?remix=${game.id}`}>Remix</Link></Button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-1">Latest version</div>
          <div className="text-sm">{vLatest?.version ?? "No playable version yet"}</div>
        </div>
        <form action={rateGame} className="space-y-2">
          <input type="hidden" name="game_id" value={game.id} />
          <input className="w-full border rounded px-2 py-1" name="score" placeholder="1-5" />
          <textarea className="w-full border rounded px-2 py-1" name="review" placeholder="Say something nice (or not)"/>
          <Button type="submit" size="sm">Rate</Button>
        </form>
        <form action={reportGame} className="space-y-2">
          <input type="hidden" name="game_id" value={game.id} />
          <textarea className="w-full border rounded px-2 py-1" name="reason" placeholder="Report reason"/>
          <Button type="submit" size="sm" variant="outline">Report</Button>
        </form>
      </div>
    </div>
  )
}
