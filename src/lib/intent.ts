/**
 * Intent contract — the single payload every input mode resolves to.
 *
 * Architecture principle: modes are adapters over one payload. A mode emits a
 * (partial) ModeOutput; normalizeIntent() fills it into the canonical Intent;
 * the recommendation engine only ever consumes Intent. New modes (voice, swipe)
 * plug in here without touching the engine.
 */
import { supabase } from "./supabase";

export type InputMode =
  | "text"
  | "surprise"
  | "this_or_that"
  | "voice"
  | "swipe"
  | "form";

export type Budget = "low" | "medium" | "high";
export type FormatPref = "order" | "cook" | "either";

/** The canonical, fully-resolved intent the engine consumes. */
export interface Intent {
  hunger_level: number | null; // 1-5; null = let engine infer
  time_available_mins: number | null; // 15 | 30 | 60; null = infer
  budget: Budget | null; // null = use profile default
  cravings: string[]; // free-form tags
  format_pref: FormatPref;
  surprise: boolean; // true = ignore most prefs, just decide
  raw_input: string; // original text/voice/swipe log — audit & learning
  mode: InputMode;
}

/** What a mode hands back — everything optional except the mode itself. */
export interface ModeOutput {
  mode: InputMode;
  hunger_level?: number | null;
  time_available_mins?: number | null;
  budget?: Budget | null;
  cravings?: string[];
  format_pref?: FormatPref;
  surprise?: boolean;
  raw_input?: string;
}

/** Map any mode's raw output into the canonical Intent shape. */
export function normalizeIntent(o: ModeOutput): Intent {
  return {
    hunger_level: o.hunger_level ?? null,
    time_available_mins: o.time_available_mins ?? null,
    budget: o.budget ?? null,
    cravings: o.cravings ?? [],
    format_pref: o.format_pref ?? "either",
    surprise: o.surprise ?? false,
    raw_input: o.raw_input ?? "",
    mode: o.mode,
  };
}

/**
 * Persist a decision session.
 *
 * Auto-fills day_of_week/hour_of_day from the clock, inserts a food_sessions
 * row, remembers the mode on the profile (so the wizard reopens into it), and
 * returns the new session id. The caller then fetches recommendations (Task 5).
 */
export async function startSession(
  userId: string,
  intent: Intent,
): Promise<string> {
  const now = new Date();

  const { data, error } = await supabase
    .from("food_sessions")
    .insert({
      user_id: userId,
      input_mode: intent.mode,
      raw_input: intent.raw_input,
      cravings: intent.cravings,
      surprise: intent.surprise,
      hunger_level: intent.hunger_level,
      time_available_mins: intent.time_available_mins,
      budget_override: intent.budget,
      format_pref: intent.format_pref,
      day_of_week: now.getDay(), // 0=Sun … 6=Sat
      hour_of_day: now.getHours(), // 0-23
    })
    .select("id")
    .single();

  if (error) throw error;

  // Remember the last-used mode so the wizard opens straight into it.
  await supabase
    .from("user_profiles")
    .update({ last_input_mode: intent.mode, updated_at: now.toISOString() })
    .eq("id", userId);

  return data.id as string;
}
