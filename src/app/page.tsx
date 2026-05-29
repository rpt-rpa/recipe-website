/**
 * App shell / root route.
 *
 * Stub for Task 1 — just the branded splash. Auth gating and routing into
 * first-run setup vs. the decision wizard land in Task 2.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime shadow-soft-lg">
        <span className="font-display text-5xl font-semibold lowercase text-forest">
          h
        </span>
      </div>
      <h1 className="mt-8 font-display text-4xl lowercase text-forest">
        i&apos;m hungry
      </h1>
      <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-orange">
        Fresh, fast &amp; for you
      </p>
    </main>
  );
}
