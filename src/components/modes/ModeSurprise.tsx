"use client";

/**
 * ✨ Surprise Me — zero input. One big button; the engine decides from context
 * (time/day) + history alone. Proves the whole mode → intent → session pipeline.
 */
import type { ModeProps } from "./types";

export default function ModeSurprise({ onSubmit, busy }: ModeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div>
        <p className="text-6xl">✨</p>
        <h1 className="mt-4 font-display text-4xl lowercase text-forest">
          surprise me
        </h1>
        <p className="mt-2 text-sm text-forest/60">
          No questions. We&apos;ll just pick something good.
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSubmit({ mode: "surprise", surprise: true })}
        className="rounded-full bg-raspberry px-10 py-5 text-lg font-semibold text-cream shadow-soft-lg transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Deciding…" : "Decide for me"}
      </button>
    </div>
  );
}
