import { supabaseServer } from "@/lib/supabase-server";

export async function getGameBySlug(slug: string) {
  try {
    const sb = supabaseServer();
    return await sb.from("games").select("*").eq("slug", slug).maybeSingle();
  } catch (err) {
    console.error("getGameBySlug exception:", err);
    return { data: null, error: err as any, status: 500, statusText: "exception" } as any;
  }
}

export async function getLatestPublishedVersion(gameId: string) {
  try {
    const sb = supabaseServer();
    return await sb
      .from("game_versions")
      .select("*")
      .eq("game_id", gameId)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  } catch (err) {
    console.error("getLatestPublishedVersion exception:", err);
    return { data: null, error: err as any, status: 500, statusText: "exception" } as any;
  }
}
