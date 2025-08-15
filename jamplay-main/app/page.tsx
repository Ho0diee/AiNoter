"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthPage() {
  const [email, setEmail] = useState("");

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ← sends users to our confirmer page that completes the code→session exchange
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await supabase.auth.signInWithOtp({
      email,
      options: {
        // ← same confirmer page for magic-link
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    alert("Magic link sent. Check your email.");
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <Button onClick={signInWithGoogle} className="w-full">
        Continue with Google
      </Button>

      <form onSubmit={signInWithEmail} className="space-y-2">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
        />
        <Button type="submit" className="w-full">Send magic link</Button>
      </form>

      <p className="text-sm text-neutral-500">
        <Link href="/">Back home</Link>
      </p>
    </div>
  );
}
