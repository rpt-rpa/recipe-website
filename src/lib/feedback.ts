/**
 * Explicit feedback + the learning loop.
 *
 * Captures whether a rec landed (choose / react / dismiss / post-meal rating)
 * and feeds the signals back:
 *  - reactions/choices/dismiss-reasons adjust learned preferred_cuisines /
 *    disliked_foods on the profile (recall-first: we learn boundaries fast).
 *  - a post-meal star rating aggregates into the dish's first_party row in the
 *    `ratings` table, which then takes precedence via resolveRating().
 *
 * Learning runs client-side here (all RLS-safe writes to the user's own rows).
 * The plan allows promoting this to an n8n/Edge Function later with no schema
 * change.
 */
import { supabase } from "./supabase";
import { dishKey } from "./ratings";

export type Reaction = "love" | "good" | "meh" | "not_it";
export type DismissReason = "too_expensive" | "not_in_mood" | "ate_recently";

/** User picked this rec to eat. */
export async function chooseRecommendation(
  sessionId: string,
  recommendationId: string,
): Promise<void> {
  await supabase
    .from("feedback")
    .insert({
      session_id: sessionId,
      recommendation_id: recommendationId,
      outcome: "chose",
    });
}

/** Quick per-card reaction → log + nudge learned preferences. */
export async function reactToRecommendation(
  sessionId: string,
  recommendationId: string,
  reaction: Reaction,
  cuisine: string,
  userId: string,
): Promise<void> {
  await supabase.from("feedback").insert({
    session_id: sessionId,
    recommendation_id: recommendationId,
    reaction,
  });
  await applyPreferenceLearning(userId, reaction, cuisine);
}

/** Per-card dismissal with an optional reason chip. */
export async function dismissRecommendation(
  sessionId: string,
  recommendationId: string,
  reason: DismissReason | null,
): Promise<void> {
  await supabase.from("feedback").insert({
    session_id: sessionId,
    recommendation_id: recommendationId,
    outcome: "dismissed",
    dismiss_reason: reason,
  });
}

/** "None of these." */
export async function skipAll(sessionId: string): Promise<void> {
  await supabase
    .from("feedback")
    .insert({ session_id: sessionId, outcome: "skipped_all" });
}

/**
 * Post-meal 1–5 rating → store on the chose feedback row + aggregate into the
 * dish's first_party rating (running average).
 */
export async function submitRating(
  sessionId: string,
  recommendationId: string,
  dishName: string,
  rating: number,
  userId: string,
): Promise<void> {
  // Attach to the existing "chose" row (or create one if missing).
  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("session_id", sessionId)
    .eq("recommendation_id", recommendationId)
    .eq("outcome", "chose")
    .maybeSingle();

  if (existing) {
    await supabase.from("feedback").update({ rating }).eq("id", existing.id);
  } else {
    await supabase.from("feedback").insert({
      session_id: sessionId,
      recommendation_id: recommendationId,
      outcome: "chose",
      rating,
    });
  }

  await upsertFirstPartyRating(dishName, userId, rating);
}

/** Running-average aggregation into a single first_party row per (dish, user). */
async function upsertFirstPartyRating(
  dishName: string,
  userId: string,
  rating: number,
): Promise<void> {
  const key = dishKey(dishName);
  const { data: row } = await supabase
    .from("ratings")
    .select("id, score, votes")
    .eq("dish_key", key)
    .eq("source", "first_party")
    .eq("user_id", userId)
    .maybeSingle();

  if (row) {
    const votes = (row.votes ?? 0) + 1;
    const score =
      ((row.score ?? 0) * (row.votes ?? 0) + rating) / Math.max(votes, 1);
    await supabase
      .from("ratings")
      .update({ score, votes, refreshed_at: new Date().toISOString() })
      .eq("id", row.id);
  } else {
    await supabase.from("ratings").insert({
      dish_key: key,
      source: "first_party",
      score: rating,
      scale: 5,
      votes: 1,
      user_id: userId,
    });
  }
}

/** Reactions move cuisines between preferred / disliked lists. */
async function applyPreferenceLearning(
  userId: string,
  reaction: Reaction,
  cuisine: string,
): Promise<void> {
  if (!cuisine || reaction === "meh") return;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("preferred_cuisines, disliked_foods")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return;

  const preferred = new Set<string>(profile.preferred_cuisines ?? []);
  const disliked = new Set<string>(profile.disliked_foods ?? []);

  if (reaction === "love" || reaction === "good") {
    preferred.add(cuisine);
    disliked.delete(cuisine);
  } else if (reaction === "not_it") {
    disliked.add(cuisine);
    preferred.delete(cuisine);
  }

  await supabase
    .from("user_profiles")
    .update({
      preferred_cuisines: Array.from(preferred),
      disliked_foods: Array.from(disliked),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
