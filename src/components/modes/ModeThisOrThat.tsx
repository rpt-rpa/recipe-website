"use client";

/**
 * 🔀 This-or-That — rapid binary taps, feels like a game.
 *
 * Five quick either/or rounds; each tap sets one intent field and auto-advances.
 * Maps to cravings / format_pref / time_available_mins / budget. After the last
 * round it emits a single ModeOutput.
 */
import { useState } from "react";
import type { ModeOutput } from "@/lib/intent";
import type { ModeProps } from "./types";

type Side = {
  emoji: string;
  label: string;
  /** Merge this side's contribution into the accumulating output. */
  apply: (o: ModeOutput) => ModeOutput;
};

type Round = { left: Side; right: Side };

const addCraving = (o: ModeOutput, tag: string): ModeOutput => ({
  ...o,
  cravings: [...(o.cravings ?? []), tag],
});

const ROUNDS: Round[] = [
  {
    left: { emoji: "🍕", label: "Pizza", apply: (o) => addCraving(o, "pizza") },
    right: {
      emoji: "🍜",
      label: "Noodles",
      apply: (o) => addCraving(o, "noodles"),
    },
  },
  {
    left: { emoji: "🔥", label: "Hot", apply: (o) => addCraving(o, "warm") },
    right: { emoji: "🧊", label: "Cold", apply: (o) => addCraving(o, "cold") },
  },
  {
    left: {
      emoji: "🍳",
      label: "Cook",
      apply: (o) => ({ ...o, format_pref: "cook" }),
    },
    right: {
      emoji: "🛵",
      label: "Order",
      apply: (o) => ({ ...o, format_pref: "order" }),
    },
  },
  {
    left: {
      emoji: "⚡",
      label: "Quick",
      apply: (o) => ({ ...o, time_available_mins: 15 }),
    },
    right: {
      emoji: "🕯️",
      label: "Leisurely",
      apply: (o) => ({ ...o, time_available_mins: 60 }),
    },
  },
  {
    left: {
      emoji: "💸",
      label: "Cheap",
      apply: (o) => ({ ...o, budget: "low" }),
    },
    right: {
      emoji: "✨",
      label: "Treat",
      apply: (o) => ({ ...o, budget: "high" }),
    },
  },
];

export default function ModeThisOrThat({ onSubmit, busy }: ModeProps) {
  const [index, setIndex] = useState(0);
  const [output, setOutput] = useState<ModeOutput>({
    mode: "this_or_that",
    cravings: [],
    raw_input: "",
  });

  function choose(side: Side) {
    if (busy) return;
    const next = side.apply(output);
    // Log the running choices into raw_input for audit/learning.
    next.raw_input = `${output.raw_input ?? ""}${output.raw_input ? " · " : ""}${side.label}`;

    if (index + 1 >= ROUNDS.length) {
      onSubmit(next);
    } else {
      setOutput(next);
      setIndex(index + 1);
    }
  }

  const round = ROUNDS[index];

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {ROUNDS.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              i < index ? "bg-lime" : i === index ? "bg-forest" : "bg-forest/15"
            }`}
          />
        ))}
      </div>

      <p className="text-center font-display text-2xl lowercase text-forest">
        this or that?
      </p>

      <div className="mt-8 flex flex-1 items-center gap-4">
        {[round.left, round.right].map((side, i) => (
          <button
            key={i}
            type="button"
            disabled={busy}
            onClick={() => choose(side)}
            className={`flex flex-1 flex-col items-center gap-3 rounded-3xl p-8 shadow-soft transition-transform active:scale-95 disabled:opacity-60 ${
              i === 0 ? "bg-lime text-forest" : "bg-orange text-cream"
            }`}
          >
            <span className="text-5xl">{side.emoji}</span>
            <span className="font-display text-xl lowercase">{side.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
