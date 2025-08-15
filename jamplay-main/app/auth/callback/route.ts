export const dynamic = "force-dynamic"; // don’t cache
export const runtime = "nodejs";

import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const event = body?.event as string | undefined;
  const session = body?.session as any | undefined;

  const res = new NextResponse(
    JSON.stringify({ ok: true, event, hasSession: !!session }),
    { headers: { "content-type": "application/json" } }
  );

  const cookieStore = nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // write the actual Set-Cookie headers onto this response
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
          // debug flag so we can see if this ran
          res.headers.set("x-setall", String(cookiesToSet.length));
        },
      },
    }
  );

  if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    res.headers.set("x-set-session", error ? "error" : "ok");
  } else if (event === "SIGNED_OUT") {
    // Clear HttpOnly cookies
    const { error } = await supabase.auth.signOut();
    res.headers.set("x-signout", error ? "error" : "ok");
  } else {
    res.headers.set("x-set-session", "skipped");
  }

  return res;
}
