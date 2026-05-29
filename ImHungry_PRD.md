# i'm hungry — Product Requirements Document

**Version:** 1.0  
**Date:** May 2026  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · n8n  
**Repo:** `recipe-sharing` (formerly RecipeVault scaffold)

---

## 1. Executive Summary

**i'm hungry** is a mobile-first web app that eliminates food decision fatigue. It learns the user's context (time of day, hunger level, budget, behavioral history) and surfaces timely, personalized meal options — either to order via delivery app deep links or cook from pantry staples.

The core product is a **personalization engine**: a no-form decision wizard with three input modes (conversational text, Surprise Me, This-or-That taps) that feeds a rule-based recommendation engine. Every choice, reaction, and dismissal teaches the app what the user actually likes — recall-first during cold start, precision-led as confidence grows.

Phase 1 (MVP — **shipped**) covers auth, first-run setup, the decision wizard, live n8n recommendations, feedback & learning, history, and profile.

---

## 2. Problem Statement

Food decisions are impulsive, emotional, and frequent — yet most people spend 15+ minutes a day figuring out what to eat. Existing solutions are either too rigid (meal planners) or too shallow (Google search). There is no app that:

- Learns your taste contextually over time without requiring upfront data entry
- Beats decision fatigue with a sub-30-second flow
- Bridges order-out and cook-at-home in one surface
- Gets smarter from implicit signals (dwell time, deep-link taps) without asking users to fill in forms

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Deliver a personalized meal recommendation in < 30 seconds
- Learn meaningfully from day 1 (recall-first, no cold-start UX cliff)
- Keep allergies/dietary restrictions as a hard filter — never inferred or overridden
- Earn trust: be transparent about what the app has learned (Profile tab)

### 3.2 Phase 1 Key Metrics (targets)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-first-recommendation | < 30 s | `time_to_decision` interaction event |
| Session repeat rate (7-day) | ≥ 40% | food_sessions count per user |
| Explicit feedback rate | ≥ 50% of sessions | feedback rows / session rows |
| Allergy filter accuracy | 100% | QA: zero violations across test users |

---

## 4. Target Users

| Persona | Pain | Primary need |
|---------|------|-------------|
| Indecisive orderer | Spends 20 min on DoorDash scrolling | Fast decision, deep link to order |
| Busy home cook | Doesn't know what to make with what's in the fridge | Pantry-aware recipe suggestions |
| Dietary-restricted eater | Tired of filtering out unsafe options manually | Allergy hard filter, zero violations |
| Habit tracker | Wants to see patterns in what they eat | History + living taste profile |

---

## 5. Brand & Design System

### 5.1 Brand Identity

**Name:** i'm hungry (lowercase wordmark, Fraunces display font)  
**Vibe:** Fresh, organic, playful, food-forward — warm farmers' market energy, not sterile SaaS  
**Tagline:** FRESH, FAST & FOR YOU

### 5.2 Color Palette

| Token | Hex | Tailwind name | Use |
|-------|-----|--------------|-----|
| Lime / chartreuse | `#C2D72E` | `lime` | Primary brand blocks, highlights, active states, produce accents |
| Forest green | `#33530E` | `forest` | Headlines, primary text, logo on light bg |
| Orange | `#F2872E` | `orange` | Secondary accent, energy, cook / delivery moments |
| Raspberry / magenta | `#C8265B` | `raspberry` | Primary CTA buttons, hot accents, hunger/urgency |
| Cream | `#FBF3E7` | `cream` | App background (warm off-white — never pure white) |
| Soft white | `#FFFFFF` | `card` | Card surfaces, contrast against cream |

Defined in `src/app/globals.css` under `@theme inline`. All Tailwind utility classes derive from these tokens.

### 5.3 Typography

| Role | Font | Treatment |
|------|------|-----------|
| Display / wordmark / headings | **Fraunces** (variable, SOFT + WONK axes) | Bold, rounded, lowercase, retro-friendly — `var(--font-fraunces)` |
| Body / UI | **Inter** | Clean, geometric — `var(--font-inter)` |
| Labels | Inter uppercase | Letter-spaced, uppercase |

### 5.4 Motifs & Style

- **Rounded everything:** generous border-radius on cards, buttons, chips (pill/lozenge shapes)
- **Produce iconography:** 🍳 🛵 ✨ 🔀 💬 used as functional icons within the decision flow
- **Confident color blocking:** lime/orange/raspberry as full-bleed section fills on the mode picker
- **Single-column mobile-first:** max-width 448px centered, generous padding
- **Touch targets:** minimum 44px on all interactive elements (enforced globally in CSS)

---

## 6. Architecture

### 6.1 Core Principles (do not break)

1. **Modes are adapters over one payload.** Every input mode resolves through `normalizeIntent()` → single `Intent` shape. The engine only ever consumes `Intent`. New modes plug in without touching the engine.

2. **Ratings go through one resolver.** `resolveRating(dishKey)` is the only place that reads the `ratings` table. Blend weights live in `RATING_CONFIG`. First-party ratings always beat external seeds.

3. **Learning math lives in `LEARNING_CONFIG`.** `exploration_rate` decays as session confidence rises. n8n reads it. Retunable without code deploys.

4. **Allergies/dietary restrictions are a hard filter, never inferred or overridden.** Captured once at setup, applied to every recommendation regardless of mode.

5. **RLS on every table.** `auth.uid() = user_id`. Users read/write only their own rows.

### 6.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 — brand tokens in `src/app/globals.css` (`@theme inline`) |
| Auth + DB | Supabase (Postgres + Auth + RLS). Client: `src/lib/supabase.ts` |
| Recommendation engine | n8n workflow (HTTP POST webhook → Code node → Respond to Webhook) |
| Fonts | Fraunces + Inter via `next/font/google` |
| Hosting | — (dev server: `npm run dev`) |

### 6.3 File Structure

```
src/
  app/
    globals.css          ← brand tokens (@theme inline), global resets, animations
    layout.tsx           ← Fraunces + Inter font load, viewport/PWA meta
    page.tsx             ← mounts <AppRouter />
  components/
    AppRouter.tsx        ← client session orchestrator; routes auth/setup/wizard
    Splash.tsx           ← loading / branded splash
    auth/
      AuthScreen.tsx     ← sign in / sign up tabs + magic link
    setup/
      SetupFlow.tsx      ← first-run: allergy chips + pantry (2 screens, skippable)
    shell/
      AppShell.tsx       ← bottom nav host; routes Home/History/Profile tabs
      BottomNav.tsx      ← fixed 3-tab nav (🏠 📋 👤)
    wizard/
      Wizard.tsx         ← mode host: mode picker → active mode → results → confirm
    modes/
      ModeText.tsx       ← 💬 free-form text + suggestion chips
      ModeSurprise.tsx   ← ✨ zero-input "decide for me"
      ModeThisOrThat.tsx ← 🔀 5 binary tap rounds
      types.ts           ← ModeProps interface
    results/
      Results.tsx        ← ranked cards (delivery + recipe), reactions, choose, dismiss
      ConfirmScreen.tsx  ← "Enjoy your [dish]!" + 5-star post-meal rating
    history/
      History.tsx        ← 30-day timeline grouped by date
    profile/
      Profile.tsx        ← allergies, restrictions, learned prefs, pantry, sign out
  lib/
    supabase.ts          ← Supabase client singleton + N8N_WEBHOOK_URL
    auth.ts              ← signUp/signIn/sendMagicLink/signOut/hasProfile
    intent.ts            ← Intent type, normalizeIntent(), startSession()
    parseTextIntent.ts   ← heuristic text parser (swappable Claude/n8n seam)
    recommendations.ts   ← fetchRecommendations() → n8n POST → persist → return
    ratings.ts           ← resolveRating() / resolveRatings() + RATING_CONFIG
    feedback.ts          ← choose/react/dismiss/skipAll/submitRating + learning
    events.ts            ← logEvent() fire-and-forget implicit signals
docs/
  supabase-schema.sql    ← full schema + RLS (reference)
  n8n/
    engine.js            ← recommendation engine source (Code node)
    workflow.sdk.ts      ← generated n8n SDK code
    README.md            ← n8n workflow docs
```

---

## 7. Database Schema

All tables in `public` schema. RLS enabled on every table (`auth.uid() = user_id`).

### 7.1 Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | Extends auth.users — allergies, dietary_restrictions (hard filters), preferred_cuisines, disliked_foods (learned), pantry_staples, budget_range, last_input_mode |
| `food_sessions` | One row per decision: input_mode, raw_input, cravings, hunger_level, time_available_mins, budget_override, format_pref, day_of_week, hour_of_day |
| `recommendations` | Ranked items per session: type, dish_name, cuisine, est_time_mins, est_cost_range, deep_link, recipe_steps, rank |
| `feedback` | Explicit signals: outcome (chose/skipped_all/dismissed), reaction (love/good/meh/not_it), dismiss_reason, rating (1–5 post-meal) |
| `interaction_events` | Implicit signals: view, dwell, tap_order, expand_recipe, reroll, time_to_decision |
| `ratings` | Source-tagged ratings: dish_key, source (first_party/google/yelp), score, scale, votes, raw_payload |
| `taste_profile` | Cached JSONB stats for the Living Taste Profile (Phase 10) |

Full DDL + RLS policies: `docs/supabase-schema.sql`

---

## 8. Input Modes

Every mode emits `ModeOutput` → `normalizeIntent()` → canonical `Intent` → `startSession()`.

| Mode | UX | Intent mapping |
|------|----|---------------|
| 💬 **Text** | Free-form box + suggestion chips. Heuristic parser (→ Claude/n8n seam). "Surprise me" text short-circuits to `surprise: true` | Parses cravings, time, budget, format_pref, hunger_level from text |
| ✨ **Surprise Me** | One big raspberry button — zero input | `{ surprise: true }` — engine decides from context + history |
| 🔀 **This-or-That** | 5 binary tap rounds (🍕 vs 🍜 · hot vs cold · cook vs order · quick vs leisurely · cheap vs treat) with progress dots | Maps to cravings, format_pref, time_available_mins, budget; logs to raw_input |

**Mode memory:** `user_profiles.last_input_mode` — wizard reopens straight into last-used mode.

---

## 9. Recommendation Engine (n8n)

**Workflow:** n8n cloud instance (`imhungry` workflow, id `ScDcVTDSW1KXHtUv`)  
**URL:** `https://lightningvision.app.n8n.cloud/webhook/06eb28a9-0438-4ab0-b82a-b9d9e81e8f04`  
**Method:** POST  
**Pattern:** Webhook → Code (engine) → Respond to Webhook

### 9.1 Enriched Request Payload

The client gathers context via RLS-safe reads and sends:

```json
{
  "user_id", "session_id", "mode", "surprise",
  "hunger_level", "time_available_mins", "budget", "cravings", "format_pref",
  "day_of_week", "hour_of_day",
  "profile": { "allergies", "dietary_restrictions", "preferred_cuisines",
               "disliked_foods", "pantry_staples", "budget_range" },
  "recently_eaten": ["Pad Thai", "..."],
  "session_count": 7
}
```

### 9.2 Scoring Rules (in `docs/n8n/engine.js`)

1. **Hard filter:** allergy + dietary restrictions — never overridden
2. **Rating boost:** `resolveRating()` — first-party > weighted external blend
3. **Speed weight:** hunger ≥ 4 or time ≤ 15 min → fast dishes ranked up
4. **Cravings boost:** cuisine / dish name matches get +1.5
5. **Format bias:** cook/order preference
6. **Budget filter:** low budget excludes high-cost options
7. **Learned preferences:** preferred_cuisines +1.0, disliked_foods −2
8. **Meal period nudge:** breakfast/lunch/dinner/snack context
9. **Repeat penalty:** eaten in last 3 days −2.5
10. **Explore/exploit:** while `exploration_rate` is high (cold start), swap lowest-ranked chosen dish for a random wildcard

### 9.3 Response Shape

```json
[
  {
    "type": "delivery",
    "dish_name": "Pad Thai",
    "cuisine": "thai",
    "est_time_mins": 35,
    "est_cost_range": "$12–18",
    "deep_link": "https://doordash.com/search/store/Pad%20Thai",
    "recipe_steps": null,
    "rating": { "score": 4.5, "scale": 5, "source": "google", "votes": 1280 },
    "rank": 1
  }
]
```

---

## 10. Ratings Architecture

Single resolver `resolveRating(dishKey)` in `src/lib/ratings.ts`. All reads go through it — no component reads raw rating columns.

| Source | Precedence | When present |
|--------|-----------|-------------|
| `first_party` | Highest — always wins | After user submits post-meal star rating |
| `google` | External fallback | Engine catalog seeds |
| `yelp` | External fallback | Engine catalog seeds |

**RATING_CONFIG** holds blend weights and min_votes threshold. Editable without touching cards or the engine.

**Card badge:** `"★ community N.N"` (raspberry) when `source === first_party`, otherwise `"★ N.N"` (neutral).

---

## 11. Feedback & Learning Loop

### 11.1 Explicit signals

| Signal | How captured | Effect |
|--------|-------------|--------|
| Choose | "I'm eating this! 🎉" button | `feedback.outcome = chose`; routes to confirm screen |
| Reaction | ❤️ / 🙂 / 😐 / 👎 per card | Logged to feedback; love/good → preferred_cuisines; not_it → disliked_foods |
| Dismiss reason | "Not this" chips (too expensive / not in mood / ate recently) | `feedback.outcome = dismissed` + reason |
| Skip all | "None of these" | `feedback.outcome = skipped_all` |
| Post-meal rating | 1–5 stars on confirm screen | `feedback.rating`; aggregated into `ratings` table as `first_party` row |

### 11.2 Implicit signals (fire-and-forget)

`tap_order`, `expand_recipe`, `reroll`, `time_to_decision` → `interaction_events` table.

### 11.3 Learning (client-side)

- Reaction "love"/"good" → add cuisine to `user_profiles.preferred_cuisines`
- Reaction "not_it" → add to `disliked_foods`
- Post-meal rating → running-average upsert in `ratings` table (`first_party`)
- Engine's repeat penalty consumes `recently_eaten` (feedback joins on chose outcome)

---

## 12. Phase Roadmap

| Phase | What ships |
|-------|-----------|
| **1 — Personalization Engine (MVP) ✅** | Auth · first-run setup · 3 input modes · n8n rule-based engine · recommendation cards · feedback + learning · history · profile · bottom nav · PWA meta |
| **2 — Live Delivery Integration** | DoorDash / UberEats API · real dish results · geolocation · ETA + price |
| **3 — Voice Mode** | 🎙️ Web Speech API → same Claude intent parser; swappable STT |
| **4 — Card-Swipe Mode** | 🃏 Tinder-for-food; emits same intent via normalizeIntent() |
| **5 — Pantry Camera Scan** | Camera → Supabase Storage → Claude Vision → pantry list |
| **6 — Recipe Intelligence** | Spoonacular API · dynamic pantry matching |
| **7 — Preference Management** | Settings screen: edit allergies, cuisines, pantry, budget, default mode |
| **8 — Smart Learning** | n8n + Claude API pattern analysis → predictive recommendations |
| **9 — Native PWA** | Installable + push notifications ("It's 6pm — hungry?") + offline |
| **10 — Living Taste Profile** | Always-updating year-in-review: top cravings, hungriest times, cook-vs-order %, adventurousness score, streaks |

---

## 13. Config & Secrets

`.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://rhpbqtfhhnjiaffwepcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API>
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://lightningvision.app.n8n.cloud/webhook/06eb28a9-0438-4ab0-b82a-b9d9e81e8f04
NEXT_PUBLIC_INTENT_PARSE_URL=<optional: Claude/n8n text parsing endpoint — falls back to local heuristic>
```

---

## 14. Commands

```bash
npm run dev     # local dev server (port 3000)
npm run build   # production build
npm run lint    # eslint
```

---

## 15. Phase 1 Verification Checklist

- [x] New user: sign up → email confirm → allergy/pantry setup → mode picker → recommendations appear → choose → history shows it
- [x] Returning user: sign in → wizard opens into last-used mode (skips setup)
- [x] All 3 modes produce valid `food_sessions` rows via `normalizeIntent()` with correct `input_mode`, `raw_input`, parsed fields
- [x] Text mode: "something spicy and fast" → `cravings: ['spicy']`, `time_available_mins: 15`
- [x] Text "surprise me" → `surprise: true`
- [x] Allergy safety: nut allergy set → no peanut dishes in any mode
- [x] Feedback: choose / react / dismiss-with-reason all write `feedback` rows
- [x] Implicit events: tap_order / expand_recipe / time_to_decision write `interaction_events`
- [x] Post-meal rating: writes `feedback.rating` + upserts `first_party` row in `ratings`
- [x] Rating flip: dish with first_party rating shows "★ community" badge; resolveRating() returns it
- [x] History: sessions appear in correct order with mode icon, dish, stars
- [x] Profile: shows allergies, restrictions, learned prefs, pantry, budget
- [x] RLS: User A cannot read User B's food_sessions
