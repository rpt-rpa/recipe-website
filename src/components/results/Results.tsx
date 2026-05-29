"use client";

/**
 * Results view — ranked option cards with full feedback controls.
 *
 * Per card: a quick reaction row (❤️🙂😐👎), an "I'm eating this!" choose
 * button, a dismiss-with-reason affordance, plus the delivery deep links /
 * recipe accordion. Explicit feedback + implicit events flow up via callbacks;
 * the Wizard owns sessionId/userId and persists them.
 */
import { useState } from "react";
import type { Recommendation } from "@/lib/recommendations";
import type { DismissReason, Reaction } from "@/lib/feedback";

const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: "love", emoji: "❤️", label: "love" },
  { key: "good", emoji: "🙂", label: "good" },
  { key: "meh", emoji: "😐", label: "meh" },
  { key: "not_it", emoji: "👎", label: "not it" },
];

const DISMISS_REASONS: { key: DismissReason; label: string }[] = [
  { key: "too_expensive", label: "too expensive" },
  { key: "not_in_mood", label: "not in the mood" },
  { key: "ate_recently", label: "ate recently" },
];

function deepLinks(dishName: string, provided: string | null) {
  const q = encodeURIComponent(dishName);
  return {
    doordash:
      provided && provided.includes("doordash")
        ? provided
        : `https://www.doordash.com/search/store/${q}`,
    ubereats: `https://www.ubereats.com/search?q=${q}`,
  };
}

function TimeBadge({ mins, tone }: { mins: number; tone: "lime" | "orange" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        tone === "lime" ? "bg-lime text-forest" : "bg-orange text-cream"
      }`}
    >
      ⏱ {mins} min
    </span>
  );
}

function CuisineTag({ cuisine }: { cuisine: string }) {
  return (
    <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium capitalize text-forest/70">
      {cuisine}
    </span>
  );
}

function RatingBadge({ rating }: { rating: Recommendation["rating"] }) {
  if (!rating) return null;
  const firstParty = rating.source === "first_party";
  return (
    <span
      title={
        firstParty
          ? `Community rated by ${rating.votes} ${rating.votes === 1 ? "person" : "people"}`
          : `From ${rating.source}`
      }
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        firstParty ? "bg-raspberry text-cream" : "bg-forest/10 text-forest/70"
      }`}
    >
      {firstParty ? "★ community" : "★"} {rating.score.toFixed(1)}
    </span>
  );
}

function FeedbackControls({
  rec,
  onChoose,
  onReact,
  onDismiss,
}: {
  rec: Recommendation;
  onChoose: (rec: Recommendation) => void;
  onReact: (rec: Recommendation, reaction: Reaction) => void;
  onDismiss: (rec: Recommendation, reason: DismissReason | null) => void;
}) {
  const [reacted, setReacted] = useState<Reaction | null>(null);
  const [showReasons, setShowReasons] = useState(false);

  return (
    <div className="mt-4 border-t border-forest/10 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-label={r.label}
              aria-pressed={reacted === r.key}
              onClick={() => {
                setReacted(r.key);
                onReact(rec, r.key);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition-all ${
                reacted === r.key
                  ? "bg-lime scale-110"
                  : "bg-cream hover:bg-forest/5"
              }`}
            >
              {r.emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowReasons((s) => !s)}
          className="text-xs font-medium text-forest/40 hover:text-forest/70"
        >
          Not this
        </button>
      </div>

      {showReasons && (
        <div className="mt-3 flex flex-wrap gap-2">
          {DISMISS_REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onDismiss(rec, r.key)}
              className="rounded-full border border-forest/15 px-3 py-1.5 text-xs font-medium text-forest/70 hover:border-forest/40"
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onDismiss(rec, null)}
            className="rounded-full border border-forest/15 px-3 py-1.5 text-xs font-medium text-forest/50 hover:border-forest/40"
          >
            just dismiss
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onChoose(rec)}
        className="mt-3 w-full rounded-full bg-forest px-4 py-3 text-sm font-semibold text-cream transition-all hover:brightness-110 active:scale-[0.99]"
      >
        I&apos;m eating this! 🎉
      </button>
    </div>
  );
}

type CardProps = {
  rec: Recommendation;
  onChoose: (rec: Recommendation) => void;
  onReact: (rec: Recommendation, reaction: Reaction) => void;
  onDismiss: (rec: Recommendation, reason: DismissReason | null) => void;
  onTapOrder: (rec: Recommendation) => void;
  onExpandRecipe: (rec: Recommendation) => void;
};

function DeliveryCard(props: CardProps) {
  const { rec, onTapOrder } = props;
  const links = deepLinks(rec.dish_name, rec.deep_link);
  return (
    <article className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">🛵</p>
          <h3 className="mt-1 font-display text-2xl lowercase text-forest">
            {rec.dish_name}
          </h3>
        </div>
        <span className="text-sm font-semibold text-forest/60">
          {rec.est_cost_range}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CuisineTag cuisine={rec.cuisine} />
        <TimeBadge mins={rec.est_time_mins} tone="lime" />
        <RatingBadge rating={rec.rating} />
      </div>
      <div className="mt-4 flex gap-2">
        <a
          href={links.doordash}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTapOrder(rec)}
          className="flex-1 rounded-full bg-raspberry px-4 py-3 text-center text-sm font-semibold text-cream transition-all hover:brightness-105 active:scale-[0.99]"
        >
          DoorDash
        </a>
        <a
          href={links.ubereats}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTapOrder(rec)}
          className="flex-1 rounded-full border-2 border-forest/15 px-4 py-3 text-center text-sm font-semibold text-forest transition-colors hover:border-forest/40"
        >
          UberEats
        </a>
      </div>
      <FeedbackControls {...props} />
    </article>
  );
}

function RecipeCard(props: CardProps) {
  const { rec, onExpandRecipe } = props;
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">🍳</p>
          <h3 className="mt-1 font-display text-2xl lowercase text-forest">
            {rec.dish_name}
          </h3>
        </div>
        <span className="text-sm font-semibold text-forest/60">
          {rec.est_cost_range}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CuisineTag cuisine={rec.cuisine} />
        <TimeBadge mins={rec.est_time_mins} tone="orange" />
        <RatingBadge rating={rec.rating} />
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            if (!o) onExpandRecipe(rec);
            return !o;
          });
        }}
        className="mt-4 w-full rounded-full bg-orange/15 px-4 py-3 text-sm font-semibold text-orange transition-colors hover:bg-orange/25"
      >
        {open ? "Hide recipe" : "View recipe"}
      </button>
      {open && rec.recipe_steps && (
        <ol className="mt-4 flex list-none flex-col gap-2">
          {rec.recipe_steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-forest/80">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold text-forest">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
      <FeedbackControls {...props} />
    </article>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-3xl bg-card p-5 shadow-soft">
      <div className="h-7 w-7 rounded-full bg-forest/10" />
      <div className="mt-3 h-6 w-2/3 rounded-full bg-forest/10" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-forest/10" />
        <div className="h-6 w-16 rounded-full bg-forest/10" />
      </div>
      <div className="mt-4 h-11 w-full rounded-full bg-forest/10" />
    </div>
  );
}

export default function Results({
  recommendations,
  loading,
  error,
  onChoose,
  onReact,
  onDismiss,
  onTapOrder,
  onExpandRecipe,
  onSkipAll,
  onRetry,
}: {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  onChoose: (rec: Recommendation) => void;
  onReact: (rec: Recommendation, reaction: Reaction) => void;
  onDismiss: (rec: Recommendation, reason: DismissReason | null) => void;
  onTapOrder: (rec: Recommendation) => void;
  onExpandRecipe: (rec: Recommendation) => void;
  onSkipAll: () => void;
  onRetry: () => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  function handleDismiss(rec: Recommendation, reason: DismissReason | null) {
    onDismiss(rec, reason);
    const id = rec.id ?? String(rec.rank);
    setDismissed((prev) => new Set(prev).add(id));
  }

  const visible = recommendations.filter(
    (r) => !dismissed.has(r.id ?? String(r.rank)),
  );

  const cardProps = (rec: Recommendation): CardProps => ({
    rec,
    onChoose,
    onReact,
    onDismiss: handleDismiss,
    onTapOrder,
    onExpandRecipe,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl lowercase text-forest">
          here&apos;s what we&apos;d eat
        </h1>
        <p className="mt-1 text-sm text-forest/60">Pick one, or skip them all.</p>
      </header>

      {loading && (
        <div className="flex flex-col gap-4">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl bg-raspberry/10 p-5 text-center">
          <p className="text-sm text-raspberry">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full bg-raspberry px-6 py-2.5 text-sm font-semibold text-cream"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {visible.map((rec) =>
            rec.type === "delivery" ? (
              <DeliveryCard key={rec.id ?? rec.rank} {...cardProps(rec)} />
            ) : (
              <RecipeCard key={rec.id ?? rec.rank} {...cardProps(rec)} />
            ),
          )}

          <button
            type="button"
            onClick={onSkipAll}
            className="mt-2 rounded-full border-2 border-forest/15 px-6 py-3.5 text-base font-semibold text-forest/70 transition-colors hover:border-forest/40"
          >
            None of these
          </button>
        </div>
      )}
    </main>
  );
}
