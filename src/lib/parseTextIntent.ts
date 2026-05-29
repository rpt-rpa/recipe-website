/**
 * Free-form text → ModeOutput.
 *
 * ── Swappable seam ──
 * Per the architecture, Text mode's parsing is meant to run through Claude
 * (via an n8n node or Edge Function). That endpoint isn't wired yet (n8n is
 * Task 5; no model key configured), so this ships a local heuristic parser as
 * the default adapter. When the endpoint exists, set NEXT_PUBLIC_INTENT_PARSE_URL
 * and parseTextIntent() will POST to it, falling back to the heuristic on error.
 * Nothing in the UI changes — modes only ever see a ModeOutput.
 */
import type { Budget, FormatPref, ModeOutput } from "./intent";

const PARSE_URL = process.env.NEXT_PUBLIC_INTENT_PARSE_URL ?? "";

const CRAVING_KEYWORDS = [
  "spicy",
  "sweet",
  "savory",
  "warm",
  "hot",
  "cold",
  "fresh",
  "cheesy",
  "crispy",
  "noodles",
  "pasta",
  "pizza",
  "soup",
  "salad",
  "burger",
  "sushi",
  "tacos",
  "curry",
  "rice",
  "sandwich",
  "comfort",
  "healthy",
  "thai",
  "italian",
  "mexican",
  "chinese",
  "japanese",
  "indian",
];

/** Local, dependency-free heuristic. Good enough to learn from; not the final word. */
export function heuristicParse(text: string): ModeOutput {
  const raw = text.trim();
  const t = raw.toLowerCase();

  // "surprise me" short-circuits to a zero-input decision.
  if (/\bsurprise\b/.test(t) || /just decide|whatever|you (pick|choose)/.test(t)) {
    return { mode: "text", surprise: true, raw_input: raw };
  }

  const cravings = CRAVING_KEYWORDS.filter((k) => t.includes(k));

  let time_available_mins: number | null = null;
  if (/\b(fast|quick|asap|now|hurry|starving|hangry)\b/.test(t)) {
    time_available_mins = 15;
  } else if (/\b(30|half hour|thirty)\b/.test(t)) {
    time_available_mins = 30;
  } else if (/\b(leisurely|slow|take my time|no rush)\b/.test(t)) {
    time_available_mins = 60;
  }

  let budget: Budget | null = null;
  if (/\b(cheap|budget|broke|affordable|inexpensive)\b/.test(t)) budget = "low";
  else if (/\b(treat|splurge|fancy|nice|fancy|expensive)\b/.test(t)) budget = "high";

  let format_pref: FormatPref | undefined;
  if (/\b(cook|make|homemade|at home|from scratch)\b/.test(t)) format_pref = "cook";
  else if (/\b(order|delivery|deliver|takeout|take-out|takeaway)\b/.test(t))
    format_pref = "order";

  let hunger_level: number | null = null;
  if (/\b(starving|hangry|famished|so hungry|really hungry)\b/.test(t))
    hunger_level = 5;
  else if (/\b(snack|light|not very hungry|peckish)\b/.test(t)) hunger_level = 2;

  return {
    mode: "text",
    cravings,
    time_available_mins,
    budget,
    format_pref,
    hunger_level,
    raw_input: raw,
  };
}

/** Public entry: remote Claude/n8n parse if configured, else local heuristic. */
export async function parseTextIntent(text: string): Promise<ModeOutput> {
  if (!PARSE_URL) return heuristicParse(text);
  try {
    const res = await fetch(PARSE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`parse endpoint ${res.status}`);
    const parsed = (await res.json()) as Partial<ModeOutput>;
    return { ...parsed, mode: "text", raw_input: text.trim() };
  } catch (err) {
    console.warn("[parseTextIntent] remote parse failed, using heuristic:", err);
    return heuristicParse(text);
  }
}
