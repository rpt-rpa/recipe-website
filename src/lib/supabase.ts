/**
 * Supabase client — single source of truth for backend access.
 *
 * Config is read from public env vars (see .env.local). The anon key is safe
 * to expose in the browser; Row Level Security protects every table.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surfaced clearly in dev so a missing key isn't a silent auth failure.
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — set them in .env.local",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * n8n recommendation workflow webhook. Set NEXT_PUBLIC_N8N_WEBHOOK_URL once the
 * workflow exists (Task 5); empty until then.
 */
export const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "";
