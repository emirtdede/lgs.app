import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types";
import { env } from "@/env";

export function createClient(): SupabaseClient<Database> {
  const client = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return client as unknown as SupabaseClient<Database>;
}
