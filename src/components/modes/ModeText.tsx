"use client";

/**
 * 💬 Text / conversational mode.
 *
 * Friendly prompt + free-form box. On send, parseTextIntent() resolves the
 * text into a ModeOutput (Claude/n8n when wired, local heuristic for now).
 * "surprise me" short-circuits to a zero-input decision.
 */
import { useState } from "react";
import { parseTextIntent } from "@/lib/parseTextIntent";
import type { ModeProps } from "./types";

const SUGGESTIONS = [
  "something spicy and fast",
  "cheap comfort food",
  "light and healthy",
  "surprise me",
];

export default function ModeText({ onSubmit, busy }: ModeProps) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  async function send(value: string) {
    const v = value.trim();
    if (!v || parsing || busy) return;
    setParsing(true);
    try {
      const output = await parseTextIntent(v);
      onSubmit(output);
    } finally {
      setParsing(false);
    }
  }

  const disabled = parsing || busy;

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-4xl lowercase leading-tight text-forest">
        what sounds good?
      </h1>
      <p className="mt-2 text-sm text-forest/60">
        Tell us in your own words — or just say &ldquo;surprise me.&rdquo;
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="mt-6 flex flex-col gap-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          autoFocus
          placeholder="something spicy and cheap, fast…"
          className="resize-none rounded-3xl border-2 border-forest/10 bg-card px-4 py-3 text-forest outline-none transition-colors focus:border-lime"
        />

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => {
                setText(s);
                send(s);
              }}
              className="rounded-full border border-forest/15 bg-card px-3 py-1.5 text-xs font-medium text-forest/70 transition-colors hover:border-forest/40 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="mt-2 rounded-full bg-raspberry px-6 py-3.5 text-base font-semibold text-cream shadow-soft transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-40"
        >
          {disabled ? "Thinking…" : "Find me food"}
        </button>
      </form>
    </div>
  );
}
