/**
 * Recommendations — fetch from the n8n engine, persist, return for display.
 *
 * The engine lives in n8n (HTTP webhook). We POST the normalized intent payload
 * and receive a ranked array (shape documented in the plan). We then write each
 * item to the `recommendations` table (tagged with session_id) so feedback and
 * history can reference it, and return the items (with their new ids) for the UI.
 */
import { supabase } from "./supabase";
import type { Intent } from "./intent";

export interface Rating {
  score: number;
  scale: number;
  source: string; // 'first_party' | 'google' | 'yelp' | 'external'
  votes: number;
}

export interface Recommendation {
  /** DB id, attached after persisting. */
  id?: string;
  type: "delivery" | "recipe";
  dish_name: string;
  cuisine: string;
  est_time_mins: number;
  est_cost_range: string;
  deep_link: string | null;
  recipe_steps: string[] | null;
  rating?: Rating | null;
  rank: number;
}

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? "";

interface EngineContext {
  profile: {
    allergies: string[];
    dietary_restrictions: string[];
    preferred_cuisines: string[];
    disliked_foods: string[];
    pantry_staples: string[];
    budget_range: string | null;
  };
  recently_eaten: string[];
  session_count: number;
}

/**
 * Gather the RLS-safe context the stateless engine needs: the user's own
 * profile (allergies/diet/learned prefs/pantry/budget), recently-eaten dishes
 * (last 3 days), and session count (drives explore/exploit). Reading these in
 * the client keeps the n8n workflow free of any Supabase service-role key.
 */
async function gatherContext(userId: string): Promise<EngineContext> {
  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [profileRes, eatenRes, countRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        "allergies, dietary_restrictions, preferred_cuisines, disliked_foods, pantry_staples, budget_range",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("feedback")
      .select("created_at, outcome, recommendations(dish_name)")
      .eq("outcome", "chose")
      .gte("created_at", threeDaysAgo),
    supabase
      .from("food_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const p = profileRes.data;
  const recently_eaten = (eatenRes.data ?? [])
    .map((row) => {
      const rec = (row as { recommendations?: { dish_name?: string } | null })
        .recommendations;
      return rec?.dish_name ?? null;
    })
    .filter((n): n is string => Boolean(n));

  return {
    profile: {
      allergies: p?.allergies ?? [],
      dietary_restrictions: p?.dietary_restrictions ?? [],
      preferred_cuisines: p?.preferred_cuisines ?? [],
      disliked_foods: p?.disliked_foods ?? [],
      pantry_staples: p?.pantry_staples ?? [],
      budget_range: p?.budget_range ?? null,
    },
    recently_eaten,
    session_count: countRes.count ?? 0,
  };
}

/** Build the payload the n8n workflow expects (any pref may be null). */
function buildPayload(
  userId: string,
  sessionId: string,
  intent: Intent,
  ctx: EngineContext,
) {
  const now = new Date();
  return {
    user_id: userId,
    session_id: sessionId,
    mode: intent.mode,
    surprise: intent.surprise,
    hunger_level: intent.hunger_level,
    time_available_mins: intent.time_available_mins,
    budget: intent.budget,
    cravings: intent.cravings,
    format_pref: intent.format_pref,
    day_of_week: now.getDay(),
    hour_of_day: now.getHours(),
    profile: ctx.profile,
    recently_eaten: ctx.recently_eaten,
    session_count: ctx.session_count,
  };
}

/** Tolerate either a bare array or `{ recommendations: [...] }`. */
function coerceItems(body: unknown): Recommendation[] {
  if (Array.isArray(body)) return body as Recommendation[];
  if (body && typeof body === "object" && Array.isArray((body as { recommendations?: unknown }).recommendations)) {
    return (body as { recommendations: Recommendation[] }).recommendations;
  }
  return [];
}

export async function fetchRecommendations(
  userId: string,
  sessionId: string,
  intent: Intent,
): Promise<Recommendation[]> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error(
      "Recommendation engine not configured — set NEXT_PUBLIC_N8N_WEBHOOK_URL.",
    );
  }

  const ctx = await gatherContext(userId);
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(userId, sessionId, intent, ctx)),
  });
  if (!res.ok) {
    throw new Error(`Recommendation engine returned ${res.status}.`);
  }

  const items = coerceItems(await res.json()).sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  );

  return persistRecommendations(sessionId, items);
}

/** Insert recs (with session_id) and merge the new DB ids back onto the items. */
async function persistRecommendations(
  sessionId: string,
  items: Recommendation[],
): Promise<Recommendation[]> {
  if (items.length === 0) return items;

  const rows = items.map((it) => ({
    session_id: sessionId,
    type: it.type,
    dish_name: it.dish_name,
    cuisine: it.cuisine,
    est_time_mins: it.est_time_mins,
    est_cost_range: it.est_cost_range,
    deep_link: it.deep_link ?? null,
    recipe_steps: it.recipe_steps ?? null,
    rank: it.rank,
  }));

  const { data, error } = await supabase
    .from("recommendations")
    .insert(rows)
    .select("id, rank");

  if (error) {
    console.warn("[recommendations] persist failed:", error.message);
    return items;
  }

  // Match returned ids back to items by rank.
  const idByRank = new Map<number, string>();
  for (const r of data ?? []) idByRank.set(r.rank as number, r.id as string);
  return items.map((it) => ({ ...it, id: idByRank.get(it.rank) ?? it.id }));
}
