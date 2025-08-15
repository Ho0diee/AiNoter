"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthListener() {
  useEffect(() => {
    const sync = async (event: string, session: any) => {
      await fetch("/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ event, session }),
      });
    };

    // 1) After Google redirects back, exchange ?code=... for a session
    // (Only try if the URL actually has a code param)
    if (typeof window !== "undefined" && window.location.search.includes("code=")) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ data }) => {
        if (data?.session) sync("SIGNED_IN", data.session); // set HttpOnly cookies ASAP
      });
    }

    // 2) Send current session (if any) to the server
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) sync("INITIAL_SESSION", data.session);
    });

    // 3) Keep syncing on changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sync(event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
