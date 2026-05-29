/**
 * Implicit interaction events — low-effort behavioral signals, gold for
 * cold-start recall learning. Fire-and-forget: never block the UI on these.
 */
import { supabase } from "./supabase";

export type EventType =
  | "view"
  | "dwell"
  | "tap_order"
  | "expand_recipe"
  | "reroll"
  | "time_to_decision";

export function logEvent(
  sessionId: string,
  recommendationId: string | null,
  eventType: EventType,
  value?: number,
): void {
  // Intentionally not awaited — implicit signals must never block interaction.
  void supabase
    .from("interaction_events")
    .insert({
      session_id: sessionId,
      recommendation_id: recommendationId,
      event_type: eventType,
      value: value ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("[events] log failed:", error.message);
    });
}
