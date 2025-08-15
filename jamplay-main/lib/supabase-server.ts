import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Next 14 + @supabase/ssr current API
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op in server components / route handlers that aren’t mutating
        },
      },
    }
  );
}
