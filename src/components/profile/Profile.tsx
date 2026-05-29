"use client";

/** Profile tab — shows the user's current dietary setup + sign-out. */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

interface ProfileData {
  dietary_restrictions: string[];
  allergies: string[];
  preferred_cuisines: string[];
  disliked_foods: string[];
  pantry_staples: string[];
  budget_range: string | null;
}

function Chip({ label, tone }: { label: string; tone: "lime" | "raspberry" | "neutral" }) {
  const colors =
    tone === "lime"
      ? "bg-lime text-forest"
      : tone === "raspberry"
        ? "bg-raspberry/15 text-raspberry"
        : "bg-forest/10 text-forest/70";
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}

export default function Profile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("user_profiles")
      .select(
        "dietary_restrictions, allergies, preferred_cuisines, disliked_foods, pantry_staples, budget_range",
      )
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data as ProfileData | null);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-28 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime">
          <span className="font-display text-2xl font-semibold lowercase text-forest">
            h
          </span>
        </div>
        <div>
          <h1 className="font-display text-2xl lowercase text-forest">
            your profile
          </h1>
          <p className="text-xs text-forest/50">Fresh, fast &amp; for you</p>
        </div>
      </div>

      {profile ? (
        <div className="flex flex-col gap-5">
          {(profile.allergies ?? []).length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Allergies (hard filter)
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((a) => (
                  <Chip key={a} label={a} tone="raspberry" />
                ))}
              </div>
            </section>
          )}

          {(profile.dietary_restrictions ?? []).length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Dietary restrictions
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.dietary_restrictions ?? []).map((d) => (
                  <Chip key={d} label={d} tone="neutral" />
                ))}
              </div>
            </section>
          )}

          {(profile.preferred_cuisines ?? []).length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Cuisines you love
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.preferred_cuisines ?? []).map((c) => (
                  <Chip key={c} label={c} tone="lime" />
                ))}
              </div>
            </section>
          )}

          {(profile.disliked_foods ?? []).length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Not for you
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.disliked_foods ?? []).map((d) => (
                  <Chip key={d} label={d} tone="neutral" />
                ))}
              </div>
            </section>
          )}

          {(profile.pantry_staples ?? []).length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Pantry staples
              </p>
              <div className="flex flex-wrap gap-2">
                {(profile.pantry_staples ?? []).map((p) => (
                  <Chip key={p} label={p} tone="neutral" />
                ))}
              </div>
            </section>
          )}

          {profile.budget_range && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
                Default budget
              </p>
              <Chip label={profile.budget_range} tone="neutral" />
            </section>
          )}

          <p className="text-xs text-forest/40">
            Taste preferences are learned automatically from your choices.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-card"
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="mt-10 w-full rounded-full border-2 border-forest/15 py-3.5 text-sm font-semibold text-forest/60 transition-colors hover:border-forest/40"
      >
        Sign out
      </button>
    </main>
  );
}
