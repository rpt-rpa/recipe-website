"use client";

/** ✨ Surprise Me — STUB (built in Task 4b). */
import type { ModeProps } from "./types";

export default function ModeSurprise({ onSubmit, busy }: ModeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-2xl lowercase text-forest">surprise me</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSubmit({ mode: "surprise", surprise: true })}
        className="rounded-full bg-raspberry px-8 py-4 font-semibold text-cream shadow-soft disabled:opacity-60"
      >
        Decide for me
      </button>
    </div>
  );
}
