"use client";

/**
 * Auth screen — sign in / sign up tabs + magic-link fallback.
 *
 * On success the AppRouter's onAuthStateChange listener takes over routing,
 * so this component only performs the action and surfaces inline errors.
 */
import { useState } from "react";
import { signIn, signUp, sendMagicLink } from "@/lib/auth";

type Tab = "signin" | "signup";

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>("signin");
  const [magicMode, setMagicMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setMagicMode(false);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }

    setLoading(true);
    try {
      if (magicMode) {
        const { error } = await sendMagicLink(email.trim());
        if (error) throw error;
        setInfo("Magic link sent — check your inbox to sign in.");
        return;
      }

      if (!password) {
        setError("Enter your password.");
        return;
      }

      if (tab === "signup") {
        const { data, error } = await signUp(email.trim(), password);
        if (error) throw error;
        // If email confirmation is on, there's no session yet.
        if (!data.session) {
          setInfo("Almost there — check your email to confirm your account.");
        }
        // If confirmation is off, onAuthStateChange routes onward automatically.
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        // Success → AppRouter routes onward.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = magicMode
    ? "Send magic link"
    : tab === "signup"
      ? "Create account"
      : "Sign in";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 py-10">
      {/* Wordmark + monogram */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime shadow-soft-lg">
          <span className="font-display text-3xl font-semibold lowercase text-forest">
            h
          </span>
        </div>
        <h1 className="mt-4 font-display text-3xl lowercase text-forest">
          i&apos;m hungry
        </h1>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-orange">
          Fresh, fast &amp; for you
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-soft-lg">
        {/* Tabs */}
        <div className="mb-6 flex rounded-full bg-cream p-1">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-forest text-cream"
                  : "bg-transparent text-forest/60"
              }`}
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-forest/70">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-2xl border-2 border-forest/10 bg-cream px-4 py-3 text-forest outline-none transition-colors focus:border-lime"
            />
          </label>

          {!magicMode && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-forest/70">
                Password
              </span>
              <input
                type="password"
                autoComplete={
                  tab === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl border-2 border-forest/10 bg-cream px-4 py-3 text-forest outline-none transition-colors focus:border-lime"
              />
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-raspberry/10 px-3 py-2 text-sm text-raspberry">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl bg-lime/20 px-3 py-2 text-sm text-forest">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-raspberry px-6 py-3.5 text-base font-semibold text-cream shadow-soft transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "One sec…" : submitLabel}
          </button>
        </form>

        {/* Magic link toggle */}
        <button
          type="button"
          onClick={() => {
            setMagicMode((m) => !m);
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-sm font-medium text-orange underline-offset-2 hover:underline"
        >
          {magicMode
            ? "Use password instead"
            : "Send magic link instead"}
        </button>
      </div>
    </main>
  );
}
