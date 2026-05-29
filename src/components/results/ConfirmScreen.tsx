"use client";

/**
 * Post-choice confirmation — "Enjoy your [dish]!" + optional 1–5 star rating.
 * Submitting a rating feeds the dish's first_party rating (Task 6 loop).
 */
import { useState } from "react";

export default function ConfirmScreen({
  dishName,
  onSubmitRating,
  onDone,
}: {
  dishName: string;
  onSubmitRating: (rating: number) => void;
  onDone: () => void;
}) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);

  async function submit(rating: number) {
    setSelected(rating);
    setSaving(true);
    await Promise.resolve(onSubmitRating(rating));
    setSaving(false);
    onDone();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-6xl">🎉</div>
      <div>
        <h1 className="font-display text-3xl lowercase text-forest">
          enjoy your {dishName.toLowerCase()}!
        </h1>
        <p className="mt-2 text-sm text-forest/60">
          How was it? (optional — helps us learn)
        </p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            disabled={saving}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(n)}
            className="text-4xl transition-transform active:scale-90 disabled:opacity-50"
          >
            <span
              className={
                n <= (hover || selected) ? "text-orange" : "text-forest/20"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="text-sm font-medium text-forest/50 hover:text-forest/80"
      >
        Skip
      </button>
    </main>
  );
}
