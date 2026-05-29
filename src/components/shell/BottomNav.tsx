"use client";

/** Fixed bottom nav — Home (wizard) · History · Profile. */
export type Tab = "home" | "history" | "profile";

const TABS: { key: Tab; emoji: string; label: string }[] = [
  { key: "home", emoji: "🏠", label: "Home" },
  { key: "history", emoji: "📋", label: "History" },
  { key: "profile", emoji: "👤", label: "Profile" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-forest/10 bg-cream px-4 pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onChange(t.key)}
              className={`flex min-h-[44px] w-16 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors ${
                isActive ? "text-forest" : "text-forest/40"
              }`}
            >
              <span className={`text-xl ${isActive ? "scale-110" : ""} transition-transform`}>
                {t.emoji}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isActive
                    ? "text-forest"
                    : "text-forest/40"
                }`}
              >
                {t.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-lime" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
