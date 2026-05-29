"use client";

/**
 * Decision wizard (mode host) — PLACEHOLDER (built out in Task 4).
 * Shown to a signed-in user who already has a profile row.
 */
import { signOut } from "@/lib/auth";

export default function Wizard({ userId }: { userId: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <h1 className="font-display text-3xl lowercase text-forest">
        what should you eat?
      </h1>
      <p className="max-w-sm text-sm text-forest/70">
        The mode-based decision wizard lands in Task 4.
      </p>
      <p className="text-xs text-forest/40">user: {userId}</p>
      <button
        onClick={() => signOut()}
        className="mt-4 rounded-full bg-raspberry px-6 py-3 font-semibold text-cream"
      >
        Sign out
      </button>
    </main>
  );
}
