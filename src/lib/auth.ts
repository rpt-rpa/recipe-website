/**
 * Auth helpers — thin wrappers over Supabase Auth.
 *
 * These are the only place the app calls `supabase.auth.*`. The session
 * listener + routing lives in the client router (AppRouter); these functions
 * just perform the action and return Supabase's result so callers can surface
 * inline errors.
 */
import { supabase } from "./supabase";

export function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

/**
 * Does this user already have a profile row? Determines whether to route a
 * signed-in user into first-run setup (no row) or the decision wizard (has row).
 */
export async function hasProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[auth] profile lookup failed:", error.message);
    return false;
  }
  return Boolean(data);
}
