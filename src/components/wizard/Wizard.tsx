"use client";

/**
 * Decision wizard — a MODE HOST, not a form.
 *
 * Opens straight into the user's last-used mode (user_profiles.last_input_mode);
 * first-ever session shows the picker once. A small persistent switcher lets the
 * user change modes any time. Each mode emits a ModeOutput, which the wizard
 * runs through normalizeIntent() → startSession(). The engine call (Task 5)
 * hangs off the returned session id.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import {
  normalizeIntent,
  startSession,
  type InputMode,
  type Intent,
  type ModeOutput,
} from "@/lib/intent";
import {
  fetchRecommendations,
  type Recommendation,
} from "@/lib/recommendations";
import {
  chooseRecommendation,
  reactToRecommendation,
  dismissRecommendation,
  skipAll,
  submitRating,
  type DismissReason,
  type Reaction,
} from "@/lib/feedback";
import { logEvent } from "@/lib/events";
import ModeText from "@/components/modes/ModeText";
import ModeSurprise from "@/components/modes/ModeSurprise";
import ModeThisOrThat from "@/components/modes/ModeThisOrThat";
import Results from "@/components/results/Results";
import ConfirmScreen from "@/components/results/ConfirmScreen";
import type { ModeProps } from "@/components/modes/types";

type PickableMode = "text" | "surprise" | "this_or_that";

const MODES: {
  key: PickableMode;
  emoji: string;
  label: string;
  blurb: string;
  tile: string; // tile bg + text colors
  Component: (p: ModeProps) => React.ReactElement;
}[] = [
  {
    key: "text",
    emoji: "💬",
    label: "Tell us",
    blurb: "Type what sounds good",
    tile: "bg-lime text-forest",
    Component: ModeText,
  },
  {
    key: "surprise",
    emoji: "✨",
    label: "Surprise me",
    blurb: "Zero input — just decide",
    tile: "bg-raspberry text-cream",
    Component: ModeSurprise,
  },
  {
    key: "this_or_that",
    emoji: "🔀",
    label: "This or that",
    blurb: "Quick taps, no typing",
    tile: "bg-orange text-cream",
    Component: ModeThisOrThat,
  },
];

export default function Wizard({ userId }: { userId: string }) {
  const [loadingMode, setLoadingMode] = useState(true);
  const [activeMode, setActiveMode] = useState<PickableMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results / confirm phases.
  const [phase, setPhase] = useState<"pick" | "results" | "confirm">("pick");
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [resultsShownAt, setResultsShownAt] = useState<number | null>(null);
  const [chosen, setChosen] = useState<Recommendation | null>(null);

  // Open straight into the last-used mode, if any.
  useEffect(() => {
    let active = true;
    supabase
      .from("user_profiles")
      .select("last_input_mode")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const last = data?.last_input_mode as InputMode | null | undefined;
        if (last === "text" || last === "surprise" || last === "this_or_that") {
          setActiveMode(last);
        }
        setLoadingMode(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function loadRecs(sessionId: string, intent: Intent) {
    setRecsLoading(true);
    setRecsError(null);
    try {
      const items = await fetchRecommendations(userId, sessionId, intent);
      setRecs(items);
      setResultsShownAt(Date.now());
    } catch (err) {
      setRecsError(
        err instanceof Error ? err.message : "Could not load recommendations.",
      );
    } finally {
      setRecsLoading(false);
    }
  }

  async function handleSubmit(output: ModeOutput) {
    setBusy(true);
    setError(null);
    try {
      const intent = normalizeIntent(output);
      const id = await startSession(userId, intent);
      setLastIntent(intent);
      setLastSessionId(id);
      setPhase("results");
      await loadRecs(id, intent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setBusy(false);
    }
  }

  function backToPick() {
    setRecs([]);
    setRecsError(null);
    setChosen(null);
    setPhase("pick");
  }

  async function handleSkipAll() {
    if (lastSessionId) {
      logEvent(lastSessionId, null, "reroll");
      await skipAll(lastSessionId);
    }
    backToPick();
  }

  function handleChoose(rec: Recommendation) {
    if (lastSessionId && rec.id) {
      if (resultsShownAt) {
        logEvent(
          lastSessionId,
          rec.id,
          "time_to_decision",
          Math.round((Date.now() - resultsShownAt) / 1000),
        );
      }
      void chooseRecommendation(lastSessionId, rec.id);
    }
    setChosen(rec);
    setPhase("confirm");
  }

  function handleReact(rec: Recommendation, reaction: Reaction) {
    if (lastSessionId && rec.id) {
      void reactToRecommendation(
        lastSessionId,
        rec.id,
        reaction,
        rec.cuisine,
        userId,
      );
    }
  }

  function handleDismiss(rec: Recommendation, reason: DismissReason | null) {
    if (lastSessionId && rec.id) {
      void dismissRecommendation(lastSessionId, rec.id, reason);
    }
  }

  function handleTapOrder(rec: Recommendation) {
    if (lastSessionId && rec.id) logEvent(lastSessionId, rec.id, "tap_order");
  }

  function handleExpandRecipe(rec: Recommendation) {
    if (lastSessionId && rec.id) logEvent(lastSessionId, rec.id, "expand_recipe");
  }

  function handleSubmitRating(rating: number) {
    if (lastSessionId && chosen?.id) {
      void submitRating(
        lastSessionId,
        chosen.id,
        chosen.dish_name,
        rating,
        userId,
      );
    }
  }

  if (loadingMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-forest/50">…</p>
      </main>
    );
  }

  if (phase === "confirm" && chosen) {
    return (
      <ConfirmScreen
        dishName={chosen.dish_name}
        onSubmitRating={handleSubmitRating}
        onDone={backToPick}
      />
    );
  }

  if (phase === "results") {
    return (
      <Results
        recommendations={recs}
        loading={recsLoading}
        error={recsError}
        onChoose={handleChoose}
        onReact={handleReact}
        onDismiss={handleDismiss}
        onTapOrder={handleTapOrder}
        onExpandRecipe={handleExpandRecipe}
        onSkipAll={handleSkipAll}
        onRetry={() => {
          if (lastSessionId && lastIntent) loadRecs(lastSessionId, lastIntent);
        }}
      />
    );
  }

  // Mode picker (first run / explicit switch).
  if (!activeMode) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
        <header className="mb-8">
          <h1 className="font-display text-4xl lowercase leading-tight text-forest">
            what should you eat?
          </h1>
          <p className="mt-2 text-sm text-forest/60">
            Pick how you want to decide.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMode(m.key)}
              className={`flex items-center gap-4 rounded-3xl ${m.tile} p-6 text-left shadow-soft transition-transform active:scale-[0.98]`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="flex flex-col">
                <span className="font-display text-xl lowercase">
                  {m.label}
                </span>
                <span className="text-sm opacity-80">{m.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-auto self-center pt-8 text-xs text-forest/40 hover:text-forest/70"
        >
          Sign out
        </button>
      </main>
    );
  }

  // Active mode view + persistent switcher.
  const ActiveComponent = MODES.find((m) => m.key === activeMode)!.Component;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
      {/* Persistent mode switcher */}
      <nav className="mb-4 flex items-center justify-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            aria-label={m.label}
            aria-pressed={activeMode === m.key}
            onClick={() => {
              setActiveMode(m.key);
              setError(null);
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-colors ${
              activeMode === m.key
                ? "bg-forest text-cream"
                : "bg-card text-forest/70 shadow-soft"
            }`}
          >
            {m.emoji}
          </button>
        ))}
      </nav>

      <ActiveComponent onSubmit={handleSubmit} busy={busy} />

      {error && (
        <p className="mt-4 rounded-xl bg-raspberry/10 px-3 py-2 text-center text-sm text-raspberry">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="mt-6 self-center text-xs text-forest/40 hover:text-forest/70"
      >
        Sign out
      </button>
    </main>
  );
}
