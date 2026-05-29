"use client";

/**
 * First-run setup — deliberately minimal (a welcome, not a form).
 *
 * Screen 1: allergies & dietary restrictions (HARD safety filter — captured
 *           once, never inferred).
 * Screen 2: pantry staples (optional, skippable).
 *
 * On finish we upsert the user_profiles row (with budget_range default
 * 'medium') and hand control back to AppRouter via onComplete, which routes
 * the now-profiled user into the wizard. Soft taste prefs are NOT asked here —
 * they're learned over time.
 */
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

type DietChip = {
  label: string;
  /** where the value lands in the profile */
  field: "dietary_restrictions" | "allergies";
};

// Screen 1 — safety. Split across the two profile columns.
const DIET_CHIPS: DietChip[] = [
  { label: "Vegetarian", field: "dietary_restrictions" },
  { label: "Vegan", field: "dietary_restrictions" },
  { label: "Gluten-Free", field: "dietary_restrictions" },
  { label: "Dairy-Free", field: "dietary_restrictions" },
  { label: "Nut allergy", field: "allergies" },
  { label: "Shellfish allergy", field: "allergies" },
  { label: "Halal", field: "dietary_restrictions" },
  { label: "Kosher", field: "dietary_restrictions" },
];

// Screen 2 — optional pantry staples.
const PANTRY_CHIPS = [
  "Eggs",
  "Pasta",
  "Rice",
  "Canned goods",
  "Bread",
  "Frozen",
  "Cheese",
  "Chicken",
];

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`rounded-full border-2 px-5 py-3 text-sm font-semibold transition-all active:scale-95 ${
        selected
          ? "border-transparent bg-lime text-forest shadow-soft"
          : "border-forest/20 bg-card text-forest/70 hover:border-forest/40"
      }`}
    >
      {label}
    </button>
  );
}

export default function SetupFlow({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<0 | 1>(0);
  const [diet, setDiet] = useState<Set<string>>(new Set());
  const [none, setNone] = useState(false);
  const [pantry, setPantry] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDiet(label: string) {
    setNone(false);
    setDiet((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function chooseNone() {
    setDiet(new Set());
    setNone(true);
  }

  function togglePantry(label: string) {
    setPantry((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function finish(savePantry: boolean) {
    setSaving(true);
    setError(null);

    const dietary_restrictions = DIET_CHIPS.filter(
      (c) => c.field === "dietary_restrictions" && diet.has(c.label),
    ).map((c) => c.label);
    const allergies = DIET_CHIPS.filter(
      (c) => c.field === "allergies" && diet.has(c.label),
    ).map((c) => c.label);
    const pantry_staples = savePantry ? Array.from(pantry) : [];

    const { error } = await supabase.from("user_profiles").upsert({
      id: userId,
      dietary_restrictions,
      allergies,
      pantry_staples,
      budget_range: "medium",
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onComplete();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-lime" : "bg-forest/15"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-3xl lowercase text-forest">
            anything we should always avoid?
          </h1>
          <p className="mt-2 text-sm text-forest/60">
            Allergies &amp; dietary needs. We&apos;ll never recommend these —
            ever.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {DIET_CHIPS.map((c) => (
              <Chip
                key={c.label}
                label={c.label}
                selected={diet.has(c.label)}
                onToggle={() => toggleDiet(c.label)}
              />
            ))}
            <Chip label="None" selected={none} onToggle={chooseNone} />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-raspberry/10 px-3 py-2 text-sm text-raspberry">
              {error}
            </p>
          )}

          <div className="mt-auto pt-8">
            <button
              type="button"
              disabled={diet.size === 0 && !none}
              onClick={() => setStep(1)}
              className="w-full rounded-full bg-raspberry px-6 py-3.5 text-base font-semibold text-cream shadow-soft transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col">
          <h1 className="font-display text-3xl lowercase text-forest">
            what&apos;s usually in your kitchen?
          </h1>
          <p className="mt-2 text-sm text-forest/60">
            Optional — helps us suggest things you can cook right now.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {PANTRY_CHIPS.map((label) => (
              <Chip
                key={label}
                label={label}
                selected={pantry.has(label)}
                onToggle={() => togglePantry(label)}
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-raspberry/10 px-3 py-2 text-sm text-raspberry">
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <button
              type="button"
              disabled={saving}
              onClick={() => finish(true)}
              className="w-full rounded-full bg-raspberry px-6 py-3.5 text-base font-semibold text-cream shadow-soft transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
            >
              {saving ? "Saving…" : "All set — let's eat"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => finish(false)}
              className="w-full text-center text-sm font-medium text-forest/60 hover:text-forest"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Escape hatch */}
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
