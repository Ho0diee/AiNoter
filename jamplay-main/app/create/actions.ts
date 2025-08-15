"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import crypto from "crypto";

function slugify(s: string) {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || "game-" + crypto.randomUUID().slice(0, 8);
}

export async function createGameAction(_prevState: any, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  if (!title || !summary) return { ok: false, error: "Title and summary are required." };

  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`;

  const { error } = await sb
    .from("games")
    .insert({
      owner_id: user.id,
      title,
      slug,
      summary,
      age_rating: "E",
      status: "draft",
    })
    .single();

  if (error) return { ok: false, error: error.message };
  redirect(`/game/${slug}`);
}
