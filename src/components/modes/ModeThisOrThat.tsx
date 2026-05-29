"use client";

/** 🔀 This-or-That — STUB (built in Task 4b). */
import type { ModeProps } from "./types";

export default function ModeThisOrThat({ busy }: ModeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="font-display text-2xl lowercase text-forest">
        this or that?
      </p>
      <p className="max-w-xs text-sm text-forest/60">
        Rapid binary taps land in Task 4b.
      </p>
      {busy && <p className="text-xs text-forest/40">working…</p>}
    </div>
  );
}
