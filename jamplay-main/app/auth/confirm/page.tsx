"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthConfirm() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let session = null;

      // CASE A: implicit flow => tokens in the URL hash
      if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
        const h = new URLSearchParams(window.location.hash.slice(1));
        const access_token = h.get("access_token") || undefined;
        const refresh_token = h.get("refresh_token") || undefined;
        if (access_token && refresh_token) {
          const { data } = await supabase.auth.setSession({ access_token, refresh_token });
          session = data?.session ?? null;
        }
      }

      // CASE B: PKCE flow => ?code= in the query string
      if (!session && typeof window !== "undefined" && window.location.search.includes("code=")) {
        const { data } = await supabase.auth.exchangeCodeForSession(window.location.href);
        session = data?.session ?? null;
      }

      // Sync to server cookies so server actions can see you
      if (session) {
        await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ event: "SIGNED_IN", session }),
        });
      }

      // Send user somewhere useful
      router.replace("/create");
    })();
  }, [router]);

  return <p style={{ padding: 16 }}>Signing you in…</p>;
}
