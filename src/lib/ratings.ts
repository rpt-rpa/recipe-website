/**
 * Ratings resolver — the ONE place that reads the `ratings` table.
 *
 * Precedence (architecture principle): first-party (this app's aggregated
 * feedback) always beats external seeds (Google/Yelp). The blend formula lives
 * only here, in RATING_CONFIG, so the rating model can be retuned or replaced
 * without touching cards or the engine.
 *
 * The n8n engine attaches a *seed* rating to each item (Google/Yelp from its
 * catalog). This resolver overrides that seed with a first-party rating once
 * one exists in the `ratings` table — so a dish flips to "★ community rated"
 * after enough first-party feedback accumulates (written in Task 6).
 *
 * Note: live Google/Yelp API fetch (to populate external rows) is deferred —
 * it needs API keys. Until then, the engine's catalog seeds are the external
 * source, and this resolver layers first-party on top.
 */
import { supabase } from "./supabase";
import type { Rating } from "./recommendations";

export const RATING_CONFIG = {
  // Relative trust when blending external sources (weighted further by votes).
  external_weights: { google: 1, yelp: 1 } as Record<string, number>,
  // First-party needs at least this many votes to take over.
  first_party_min_votes: 1,
};

/** Normalized dish identity used to match rows across sources. */
export function dishKey(dishName: string): string {
  return dishName.trim().toLowerCase();
}

interface RatingRow {
  dish_key: string;
  source: string;
  score: number;
  scale: number;
  votes: number;
}

function blend(rows: RatingRow[]): Rating | null {
  if (rows.length === 0) return null;

  // First-party wins outright when present with enough votes.
  const firstParty = rows.filter(
    (r) => r.source === "first_party" && r.votes >= RATING_CONFIG.first_party_min_votes,
  );
  if (firstParty.length > 0) {
    const votes = firstParty.reduce((s, r) => s + r.votes, 0);
    const score =
      firstParty.reduce((s, r) => s + (r.score / r.scale) * 5 * r.votes, 0) /
      Math.max(votes, 1);
    return { score: round1(score), scale: 5, source: "first_party", votes };
  }

  // Otherwise blend external sources, weighted by config × votes.
  let wSum = 0;
  let scoreSum = 0;
  let votes = 0;
  for (const r of rows) {
    const w = (RATING_CONFIG.external_weights[r.source] ?? 1) * Math.max(r.votes, 1);
    scoreSum += (r.score / r.scale) * 5 * w;
    wSum += w;
    votes += r.votes;
  }
  if (wSum === 0) return null;
  return { score: round1(scoreSum / wSum), scale: 5, source: "external", votes };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Resolve a single dish's rating from the `ratings` table (null if none). */
export async function resolveRating(key: string): Promise<Rating | null> {
  const { data, error } = await supabase
    .from("ratings")
    .select("dish_key, source, score, scale, votes")
    .eq("dish_key", key);
  if (error) {
    console.warn("[ratings] resolve failed:", error.message);
    return null;
  }
  return blend((data ?? []) as RatingRow[]);
}

/** Batch resolver — one query for many dish_keys. Returns key → Rating. */
export async function resolveRatings(
  keys: string[],
): Promise<Map<string, Rating>> {
  const out = new Map<string, Rating>();
  if (keys.length === 0) return out;

  const { data, error } = await supabase
    .from("ratings")
    .select("dish_key, source, score, scale, votes")
    .in("dish_key", keys);
  if (error) {
    console.warn("[ratings] batch resolve failed:", error.message);
    return out;
  }

  const byKey = new Map<string, RatingRow[]>();
  for (const row of (data ?? []) as RatingRow[]) {
    const arr = byKey.get(row.dish_key) ?? [];
    arr.push(row);
    byKey.set(row.dish_key, arr);
  }
  for (const [key, rows] of byKey) {
    const blended = blend(rows);
    if (blended) out.set(key, blended);
  }
  return out;
}
