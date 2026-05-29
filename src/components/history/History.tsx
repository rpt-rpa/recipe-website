"use client";

/**
 * History view — last 30 days of decisions.
 * Queries food_sessions → chosen recommendation (if any) → star rating.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface HistoryItem {
  sessionId: string;
  createdAt: string;
  inputMode: string;
  dishName: string | null;
  cuisine: string | null;
  type: string | null;
  rating: number | null;
}

function modeLabel(mode: string) {
  if (mode === "surprise") return "✨";
  if (mode === "this_or_that") return "🔀";
  return "💬";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function History({ userId }: { userId: string }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    supabase
      .from("food_sessions")
      .select(
        `id, created_at, input_mode,
         feedback(outcome, rating, recommendations(dish_name, cuisine, type))`,
      )
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("[history]", error.message);
          setLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: HistoryItem[] = (data as any[]).map((s) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chose = (s.feedback ?? []).find((f: any) => f.outcome === "chose");
          return {
            sessionId: s.id as string,
            createdAt: s.created_at as string,
            inputMode: (s.input_mode ?? "text") as string,
            dishName: (chose?.recommendations?.dish_name ?? null) as string | null,
            cuisine: (chose?.recommendations?.cuisine ?? null) as string | null,
            type: (chose?.recommendations?.type ?? null) as string | null,
            rating: (chose?.rating ?? null) as number | null,
          };
        });

        setItems(mapped);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-8">
        <h1 className="mb-6 font-display text-3xl lowercase text-forest">
          what you&apos;ve eaten
        </h1>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-card p-4 shadow-soft"
            >
              <div className="h-5 w-2/3 rounded-full bg-forest/10" />
              <div className="mt-2 h-4 w-1/3 rounded-full bg-forest/10" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 pb-24 text-center">
        <p className="text-4xl">🍽️</p>
        <h2 className="font-display text-2xl lowercase text-forest">
          no meals yet
        </h2>
        <p className="text-sm text-forest/60">
          Make your first decision to start your history.
        </p>
      </main>
    );
  }

  // Group by date label.
  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const label = formatDate(item.createdAt);
    const arr = groups.get(label) ?? [];
    arr.push(item);
    groups.set(label, arr);
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-28 pt-8">
      <h1 className="mb-6 font-display text-3xl lowercase text-forest">
        what you&apos;ve eaten
      </h1>

      <div className="flex flex-col gap-6">
        {Array.from(groups.entries()).map(([dateLabel, dayItems]) => (
          <section key={dateLabel}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest/50">
              {dateLabel}
            </p>
            <div className="flex flex-col gap-2">
              {dayItems.map((item) => (
                <div
                  key={item.sessionId}
                  className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft"
                >
                  {/* Mode icon */}
                  <span className="mt-0.5 text-xl">
                    {modeLabel(item.inputMode)}
                  </span>

                  <div className="flex-1 min-w-0">
                    {item.dishName ? (
                      <>
                        <p className="font-display text-lg lowercase leading-snug text-forest truncate">
                          {item.dishName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {item.cuisine && (
                            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs capitalize text-forest/70">
                              {item.cuisine}
                            </span>
                          )}
                          {item.type === "delivery" && (
                            <span className="text-xs text-forest/40">🛵 delivery</span>
                          )}
                          {item.type === "recipe" && (
                            <span className="text-xs text-forest/40">🍳 cooked</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm italic text-forest/50">
                        skipped all options
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-forest/40">
                      {formatTime(item.createdAt)}
                    </span>
                    {item.rating != null && (
                      <span className="text-xs font-semibold text-orange">
                        {"★".repeat(item.rating)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
