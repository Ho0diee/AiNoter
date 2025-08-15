import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function ServerWhoAmI() {
  const cookieStore = cookies();
  const cookieNames = cookieStore.getAll().map(c => c.name);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {}, // no-op in server component
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  return (
    <pre id="whoami" style={{ padding: 8, fontSize: 12, background: "#111", color: "#0f0" }}>
      {JSON.stringify({ user, error, cookieNames }, null, 2)}
    </pre>
  );
}
