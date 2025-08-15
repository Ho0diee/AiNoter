"use client"

import { supabaseBrowser } from "@/lib/supabase-browser"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const sb = supabaseBrowser()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault()
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` }
    })
    setSent(true)
  }

  async function signInGoogle() {
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/confirm` }
    })
  }

  async function signOut() {
    await sb.auth.signOut()
    await fetch("/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ event: "SIGNED_OUT", session: null }),
    })
    location.href = "/"
  }

  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {sent ? (
        <div className="text-sm">Check your email for the magic link.</div>
      ) : (
        <form onSubmit={signInEmail} className="space-y-2">
          <input
            className="w-full border rounded px-2 py-1"
            placeholder="you@email.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            type="email"
            required
          />
          <Button type="submit" className="w-full">Email magic link</Button>
        </form>
      )}
      <Button onClick={signInGoogle} variant="outline" className="w-full">Continue with Google</Button>
      <hr className="my-2" />
      <Button onClick={signOut} variant="ghost" className="w-full">Sign out</Button>
    </div>
  )
}
