/**
 * Branded splash — the lime badge "h" monogram + wordmark. Reused as the
 * loading state while auth/session resolves.
 */
export default function Splash({ subtitle }: { subtitle?: string }) {
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
        {subtitle ?? "Fresh, fast & for you"}
      </p>
    </main>
  );
}
