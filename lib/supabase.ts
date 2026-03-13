import { createBrowserClient } from "@supabase/ssr";

export const FAKE_DOMAIN = "sonic-boom-simulator.app";

/** Browser (client component) Supabase client */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
