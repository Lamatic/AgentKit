import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

/** Get or construct the Lamatic client. */
function getClient(): SupabaseClient {
  if (!client) {
    // Fail fast on missing credentials: a placeholder networked client would
    // hide misconfiguration and could send queries to an unrelated endpoint.
    // Thrown lazily (on first query, never at import) so `next build` can
    // collect page config without credentials present.
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "[supabase-server] SUPABASE_URL and SUPABASE_ANON_KEY must be set. " +
          "Copy apps/.env.example to .env.local and fill in your values.",
      );
    }
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

// Lazily-initialized client: identical call surface (`supabase.from(...)`),
// but the credential check runs on first query instead of at import time.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const resolved = getClient() as unknown as Record<string | symbol, unknown>;
    const value = resolved[prop];
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
