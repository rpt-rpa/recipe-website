# i'm hungry — "What Should I Eat?" App

Mobile-first web app that beats food decision fatigue: it learns the user's
context (time, hunger, budget, behavior history) and surfaces timely,
personalized meal options — to order via delivery deep links or cook from
pantry staples. Phase 1 (MVP) is the personalization engine.

> Implementation plan: `~/.claude/plans/shiny-purring-phoenix.md`
> Product requirements: `ImHungry_PRD.md` · Design & user flows: `ImHungry_Design.md`

## Stack

- **Next.js 16 + React 19 + TypeScript** (App Router) — the plan was written for
  vanilla HTML/CSS/JS, but we adapted it to the existing Next.js scaffold.
  Implement plan "files" as React components / lib modules under `src/`.
- **Tailwind CSS v4** — brand tokens live in `src/app/globals.css` (`@theme`).
- **Supabase** — Postgres + Auth + Edge Functions. Client: `src/lib/supabase.ts`
  (uses `@supabase/supabase-js`, not the CDN UMD global).
- **n8n** — recommendation workflow engine (HTTP webhook, set in Task 5).

## Brand & design tokens

Defined once in `src/app/globals.css` under `@theme`. Use these Tailwind names:

| Token | Value | Use |
|-------|-------|-----|
| `lime` | `#C2D72E` | primary brand blocks, highlights, fresh accents |
| `forest` | `#33530E` | headlines, primary text, logo on light bg |
| `orange` | `#F2872E` | secondary accent, energy, cook/delivery |
| `raspberry` | `#C8265B` | primary CTA buttons, hot/urgency cues |
| `cream` | `#FBF3E7` | app background (warm off-white, never pure white) |
| `card` | `#FFFFFF` | card surfaces |

- **Display font:** Fraunces (`--font-display`, var `--font-fraunces`) — bold,
  rounded, friendly, lowercase wordmark `i'm hungry`.
- **UI font:** Inter (`--font-ui`, var `--font-inter`).
- Tagline: **"FRESH, FAST & FOR YOU"** (uppercase, letter-spaced).
- Motifs: rounded everything (pills/lozenges), produce iconography, confident
  color blocking, single-column mobile-first, min 44px touch targets.

## Config / secrets

`.env.local` (gitignored):

- `NEXT_PUBLIC_SUPABASE_URL` = https://rhpbqtfhhnjiaffwepcc.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase dashboard → Settings → API)
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` = (set in Task 5)

## Architecture principles (do not break these)

- **Modes are adapters over one payload.** Every input mode (text / surprise /
  this-or-that / future voice & swipe) resolves through `normalizeIntent()` and
  emits the same `intent` shape. The engine only ever consumes `intent`.
- **Ratings go through one resolver.** `resolveRating(dishKey)` is the only place
  that reads the `ratings` table; blend weights live in a `RATING_CONFIG` block.
  First-party ratings always beat external (Google/Yelp) seeds.
- **Learning math lives in `LEARNING_CONFIG`** (recall-first explore/exploit;
  `exploration_rate` decays as confidence rises). n8n reads it.
- **Allergies/dietary restrictions are a hard filter, never inferred or
  overridden.** Soft taste prefs are learned, never asked upfront.
- **RLS on every table:** `auth.uid() = user_id`. Users read/write only own rows.

## Database

Schema + RLS policies: `docs/supabase-schema.sql`. Apply via the Supabase MCP
server (configured in `.mcp.json`) or the dashboard SQL editor.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — eslint
