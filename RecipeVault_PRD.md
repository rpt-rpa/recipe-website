# RecipeVault — Product Requirements Document

**Version:** 1.0
**Date:** February 2026
**Stack:** Next.js 14 · Supabase · Tailwind CSS
**Brand Palette:** Coral Reef — Kalanchoe · Amazonite · Poetry Pink · Grapefruit · Cinnamon

---

## 1. Executive Summary

RecipeVault is a **visual-first**, community-driven recipe sharing platform where users can upload, discover, organize, and rate recipes. The platform is designed around the principle that **food is visual** — imagery and interactive presentation take center stage at every touchpoint. Rich tagging (allergies, dietary preferences, cuisine type, and mood-based filters) combines with a voting system that helps surface the best-loved recipes and lets users track which dishes they have personally tried and rated.

Every recipe is guaranteed a compelling visual presence. When users upload a photo, it's presented as a hero-quality image. When they don't, the platform **auto-generates a styled visual** — either an AI-generated image via an image generation API or a beautiful text-based card with recipe metadata, cuisine colors, and typography. There is no such thing as a recipe without a visual on RecipeVault.

The MVP targets home cooks who want a beautiful, immersive, ad-free recipe browsing experience with social proof and personal tracking. The product is built on Next.js 14 (App Router) with Supabase handling authentication, database, storage, and real-time features.

---

## 2. Problem Statement

Existing recipe platforms suffer from several core pain points:

- **Signal-to-noise:** Popular sites are cluttered with ads and long-form blog content before reaching the actual recipe.
- **Visual mediocrity:** Recipe listings are text-heavy grids with inconsistent or missing photos. Recipes without images look broken or get ignored, creating a two-tier experience that punishes quick uploaders.
- **Filtering gaps:** Most platforms lack robust filtering for allergies, dietary restrictions, or mood-based discovery (e.g., comfort food, quick weeknight meals).
- **Personal tracking:** Users cannot easily track which recipes they have tried versus bookmarked, or express whether a tried recipe was a hit or a miss.
- **Community trust:** Ratings are often inflated or lack context. A voting system combined with "tried it" tracking creates more authentic signals.

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Deliver a **visual-first**, immersive, ad-free recipe browsing experience where imagery drives discovery.
- Guarantee every recipe has a compelling visual — user-uploaded photo, AI-generated image, or styled text card.
- Enable precise discovery through multi-dimensional tagging and filtering.
- Build community trust through transparent upvote/downvote ranking.
- Help users build a personal recipe history of tried, liked, and disliked dishes.

### 3.2 Key Metrics (MVP)

| Metric | Target (90 days) | Measurement |
|---|---|---|
| Registered users | 500+ | Supabase auth count |
| Recipes uploaded | 1,000+ | Database count |
| Avg. votes per recipe | ≥ 5 | votes table aggregate |
| Filter usage rate | ≥ 40% of sessions | Event analytics |
| Return rate (7-day) | ≥ 30% | Session analytics |

---

## 4. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| Home Cook | Cooks 3–5 times/week, browses for inspiration | Fast discovery, save favorites, track what worked |
| Allergy-Conscious Parent | Manages dietary restrictions for family | Reliable allergy/intolerance filtering |
| Meal Prepper | Plans meals weekly, values efficiency | Batch-friendly tags, quick filters |
| Recipe Creator | Shares original recipes, wants feedback | Upload flow, community votes, visibility |

---

## 5. Design Philosophy: Visual-First & Interactive

RecipeVault treats every screen as a visual experience. The brand identity draws from the **Coral Reef palette** — a warm, organic, beachy aesthetic that feels inviting, calming, and appetizing. The following principles govern all UI decisions.

### 5.0.1 Brand Palette: Coral Reef

The entire application is built on a five-color system inspired by natural coastal tones. Every UI element, from backgrounds to buttons to generated recipe cards, draws from this palette.

| Token | Name | Hex | Role |
|---|---|---|---|
| `--color-kalanchoe` | Kalanchoe | `#A8C5B0` | Sage green — secondary backgrounds, tag chips (dietary/allergy), success states, subtle accents |
| `--color-amazonite` | Amazonite | `#2B6B5E` | Deep teal — primary brand color, headings, nav bar, active states, links, focus rings |
| `--color-poetry-pink` | Poetry Pink | `#EDAC96` | Soft peach — card backgrounds, hover states, recipe card gradient base, warm highlights |
| `--color-grapefruit` | Grapefruit | `#E8734A` | Coral orange — primary CTA buttons, upvote fill, notification badges, energetic accents |
| `--color-cinnamon` | Cinnamon | `#A97455` | Warm copper — secondary text, borders, downvote fill, earthy grounding elements |

**Extended palette:**

| Token | Hex | Role |
|---|---|---|
| `--color-sand` | `#F5EDE6` | Page background (light mode) — warm cream, never pure white |
| `--color-driftwood` | `#3D3028` | Primary text (light mode) — warm near-black, never pure #000 |
| `--color-foam` | `#FDFAF7` | Card surface, modal background — softer than sand |
| `--color-deep-sea` | `#1A2E2A` | Page background (dark mode) — rich dark teal |
| `--color-moonlit-sand` | `#D4C5B9` | Muted text, placeholders, disabled states |

**Tailwind config:** Define all palette tokens as CSS custom properties in `globals.css` and map them in `tailwind.config.ts` under `extend.colors` for utility class access (e.g., `bg-kalanchoe`, `text-amazonite`, `border-cinnamon`).

**Design feel:** The overall aesthetic is organic, warm, and textured — think sun-bleached wood, succulent greens, citrus tones, and copper cookware. Avoid cold blues, stark whites, or sterile tech aesthetics. Typography should feel approachable: **Plus Jakarta Sans** or **Nunito** for body text; **Playfair Display** or **DM Serif Display** for recipe titles and headings to add editorial warmth. Subtle background textures (linen, paper grain) can be used sparingly via CSS or SVG patterns.

### 5.0.2 Imagery Is Non-Negotiable

Every recipe card, detail page, and collection view must display a high-quality visual. The system enforces this through a three-tier fallback hierarchy:

1. **User-uploaded photo** (preferred) — displayed as a hero image with subtle parallax or zoom-on-hover.
2. **AI-generated image** — when no photo is uploaded, the system generates a photorealistic food image using an image generation API (e.g., OpenAI DALL·E 3, Stability AI, or Replicate SDXL) based on the recipe title, cuisine tags, and key ingredients. The generated image is stored in Supabase Storage and cached permanently. A small "AI-generated" badge in Cinnamon (`#A97455`) is shown for transparency.
3. **Styled text card (fallback)** — if AI generation fails or is disabled, the system renders a beautiful CSS/Canvas-based card using: the recipe title in Playfair Display, a gradient background from the Coral Reef palette (mapped by cuisine — see Section 6.7.2), key ingredient icons or emoji, and prep/cook time as a visual element. These are generated server-side as OG-image-quality PNGs using `@vercel/og` or Satori and stored in Supabase Storage.

### 5.0.3 Interaction Design Principles

- **Microinteractions everywhere:** Vote buttons animate (bounce, fill with Grapefruit for upvote / Cinnamon for downvote), bookmarks pulse in Poetry Pink, cards scale on hover, tag chips ripple on selection.
- **Smooth transitions:** Page navigations use shared-element transitions (View Transitions API or Framer Motion). Recipe cards morph into detail pages rather than hard-cutting.
- **Skeleton-first loading:** Every data-dependent section shows a purpose-built skeleton (shimmer effect in Poetry Pink → Sand gradient, not spinners) that matches the layout of the incoming content.
- **Touch-optimized:** Swipe gestures on mobile for browsing (swipe left = skip, swipe right = save). Haptic-style visual feedback on tap.
- **Masonry/Pinterest-style grid:** The browse page uses a masonry layout where images of varying aspect ratios create a visually dynamic, magazine-like feed — not a rigid uniform grid.
- **Dark mode support:** Full dark mode using Deep Sea (`#1A2E2A`) background with carefully tuned image overlays. Kalanchoe and Poetry Pink become the accent stars; Grapefruit remains the CTA color. Tag chip palettes adapt to maintain contrast.
- **Warm, never cold:** All shadows use warm-toned box shadows (`rgba(169, 116, 85, 0.1)` — Cinnamon-based) instead of default gray. Border colors derive from the palette, never `#ccc` or `#e5e7eb`.

### 5.0.4 Visual Hierarchy on Recipe Cards

Recipe cards are the primary UI element. They follow this layered structure:

1. **Image layer** (70% of card height) — full-bleed cover image with a subtle gradient overlay at the bottom (Driftwood → transparent) for text legibility.
2. **Floating badge layer** — vote score in a Grapefruit pill badge (top-right), cuisine tag in an Amazonite chip (top-left), and time estimate in a Foam semi-transparent pill (bottom-left over gradient).
3. **Content layer** (30%, Foam background) — recipe title in Playfair Display (Driftwood color, bold, max 2 lines with ellipsis), author avatar + name in Moonlit Sand (small), and up to 3 tag chips using category-mapped palette colors (allergy = Kalanchoe, preference = Amazonite, cuisine = Poetry Pink, mood = Grapefruit).
4. **Interactive overlay** — on hover (desktop) or long-press (mobile), the card lifts with a warm Cinnamon-toned shadow, and a Poetry Pink translucent overlay reveals: bookmark button (heart), quick-vote buttons, and a "View Recipe" CTA in Grapefruit.

### 5.0.5 Component Color Mapping

| Component | Default State | Hover/Active | Disabled |
|---|---|---|---|
| Primary CTA button | Grapefruit bg, Foam text | Darken 10%, slight scale | Moonlit Sand bg, muted text |
| Secondary button | Transparent, Amazonite border+text | Kalanchoe bg tint | Moonlit Sand border |
| Nav bar | Amazonite bg, Foam text | — | — |
| Tag chip (allergy) | Kalanchoe bg, Amazonite text | Darken Kalanchoe 10% | Moonlit Sand bg |
| Tag chip (cuisine) | Poetry Pink bg, Cinnamon text | Darken Poetry Pink 10% | Moonlit Sand bg |
| Tag chip (mood) | Grapefruit bg at 20% opacity, Grapefruit text | Fill to 40% | Moonlit Sand bg |
| Tag chip (dietary) | Amazonite bg at 15% opacity, Amazonite text | Fill to 30% | Moonlit Sand bg |
| Upvote button (active) | Grapefruit fill | Spring bounce | Moonlit Sand |
| Downvote button (active) | Cinnamon fill | Spring bounce | Moonlit Sand |
| Bookmark heart (active) | Poetry Pink fill | Pulse animation | Moonlit Sand |
| Card surface | Foam bg | Lift + Cinnamon shadow | — |
| Input focus ring | Amazonite ring (2px) | — | — |

---

## 6. Core Features

### 6.1 Authentication & User Profiles

Powered entirely by Supabase Auth.

- **Sign-up / login:** Email + password, Google OAuth, and magic link options.
- **Profile page:** Display name, avatar (Supabase Storage), bio, and links to uploaded recipes.
- **Personal dashboard:** My Recipes (uploaded), Saved Recipes (bookmarked), Tried & Rated (vote history).

### 6.2 Recipe Upload & Management

A structured recipe creation form with the following fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Title | Text (max 120 chars) | Yes | Indexed for search |
| Description | Textarea (max 500 chars) | Yes | Short summary shown in cards |
| Cover Image | Image upload | No | Optional — if not provided, the system auto-generates a visual (see Section 5.0.1). Stored in Supabase Storage; max 5 MB |
| Prep Time | Number (minutes) | Yes | Used in filters |
| Cook Time | Number (minutes) | Yes | Used in filters |
| Servings | Number | Yes | |
| Ingredients | Structured list | Yes | Quantity + unit + ingredient name per row |
| Instructions | Ordered list of steps | Yes | Rich text per step with optional image |
| Tags | Multi-select | Yes | See Tagging System (5.3) |
| Nutrition (optional) | Key-value pairs | No | Calories, protein, carbs, fat |

**Edit / Delete:** Authors can edit or delete their own recipes. Edits are reflected immediately; deletes are soft-deletes (retained 30 days for moderation).

### 6.3 Tagging System

Tags are the backbone of discovery. They are organized into four dimensions, each stored as a separate tag category in the database.

#### 6.3.1 Allergy / Intolerance Tags

These tags indicate what a recipe is **free from**. They are critical for safety, so they appear with a distinct visual indicator.

Gluten-Free, Dairy-Free, Nut-Free, Egg-Free, Soy-Free, Shellfish-Free, Sesame-Free, Nightshade-Free

#### 6.3.2 Dietary Preference Tags

Vegetarian, Vegan, Pescatarian, Keto, Paleo, Whole30, Low-FODMAP, Halal, Kosher

#### 6.3.3 Cuisine Tags

Italian, Mexican, Indian, Thai, Japanese, Chinese, Korean, Mediterranean, Middle Eastern, American, French, Ethiopian, Caribbean, and more (expandable)

#### 6.3.4 Mood / Occasion Tags

These enable contextual, emotion-driven discovery:

Comfort Food, Quick Weeknight, Date Night, Meal Prep, Party/Entertaining, Kid-Friendly, Healthy, Indulgent, One-Pot, Budget-Friendly, Seasonal

**Filtering UX:** Users can combine tags across dimensions using AND logic within a dimension and AND/OR toggles between dimensions. Example: "Gluten-Free" AND "Italian" AND ("Comfort Food" OR "Quick Weeknight").

### 6.4 Browse & Search

- **Full-text search:** Powered by Supabase's `pg_trgm` and `tsvector` on title, description, and ingredients.
- **Tag filter panel:** Collapsible sidebar (desktop) or bottom-sheet (mobile) with grouped tag checkboxes. Tags use color-coded chips by category.
- **Sort options:** Newest, Most Upvoted, Most Tried, Fastest to Make.
- **Masonry grid with infinite scroll:** Pinterest-style masonry layout with cursor-based pagination (20 recipes per page). Images of varying aspect ratios create a visually dynamic, magazine-like feed.
- **Recipe cards:** Full-bleed cover image (70% of card), floating vote score badge, cuisine tag chip, prep+cook time overlay, title, author, and top 3 tags. Hover/tap reveals quick-action overlay (vote, bookmark, view). See Section 5.0.4 for full card spec.

### 6.5 Voting & Tracking System

The voting system serves two purposes: community ranking and personal tracking.

#### 6.5.1 Upvote / Downvote

- Authenticated users can upvote or downvote any recipe (one vote per user per recipe).
- Votes toggle: clicking the same button again removes the vote; clicking the opposite switches it.
- **Score:** Displayed as net score (upvotes minus downvotes). Used for "Most Upvoted" sort.
- **Ranking algorithm:** Wilson score interval for surfacing quality with confidence, not just raw count.

#### 6.5.2 Tried-It Tracking

When a user votes on a recipe, it is automatically marked as "tried" in their personal history. This creates three personal states for every recipe:

- **Not tried:** No vote recorded. Default state.
- **Tried & Liked:** User upvoted. Appears in "Liked" tab on dashboard.
- **Tried & Disliked:** User downvoted. Appears in "Disliked" tab.

Users can also bookmark (save) a recipe without voting, which adds it to their "Saved" list as a "want to try" state.

### 6.6 Saved / Bookmarked Recipes

- One-click bookmark icon on recipe cards and detail pages.
- Saved recipes appear on the user's dashboard under "Saved."
- Users can organize saved recipes into custom collections (e.g., "Weeknight Rotation," "Holiday Baking").

### 6.7 Auto-Generated Recipe Visuals

This feature ensures every recipe has a visual, even if the author skips the photo upload. It runs automatically on recipe creation/update when `cover_image_url` is null.

#### 6.7.1 AI Image Generation (Primary)

When a recipe has no user-uploaded cover image, the system generates one:

- **Trigger:** On recipe INSERT or UPDATE where `cover_image_url IS NULL`, a Supabase Edge Function fires.
- **Prompt construction:** The function builds a prompt from: recipe title, cuisine tag(s), and the first 3–5 key ingredients. Example prompt: `"A beautifully plated bowl of spicy Thai basil chicken with jasmine rice, overhead shot, natural lighting, food photography style"`.
- **API call:** The Edge Function calls an image generation API (OpenAI DALL·E 3 recommended for quality; Stability AI SDXL as fallback for cost).
- **Storage:** The generated image is saved to Supabase Storage under `generated-covers/{recipe_id}.webp` and the URL is written to `cover_image_url`. A boolean flag `is_cover_ai_generated` is set to `true`.
- **Transparency:** A small "AI-generated image" badge is shown on the recipe card and detail page.
- **Override:** If the user later uploads their own photo, it replaces the AI-generated image and the flag resets.

#### 6.7.2 Styled Text Card (Fallback)

If the AI generation API is unavailable, rate-limited, or disabled, the system generates a beautiful text-based card:

- **Technology:** `@vercel/og` (Satori) generates a PNG at 1200×630px (OG image dimensions, perfect for cards and social sharing).
- **Design template:** The card includes:
  - Recipe title in Playfair Display (bold, warm white or palette accent)
  - A background gradient derived from the Coral Reef palette, shifted by cuisine category
  - Ingredient icons or emoji (up to 5) arranged decoratively
  - Prep + cook time in a small pill at the bottom
  - A subtle linen texture overlay for warmth and visual richness
- **Cuisine-to-gradient map (all derived from Coral Reef palette):**

| Cuisine | Gradient Start | Gradient End | Text Color | Accent |
|---|---|---|---|---|
| Italian | `#E8734A` (Grapefruit) | `#EDAC96` (Poetry Pink) | `#FDFAF7` (Foam) | `#A97455` (Cinnamon) |
| Mexican | `#E8734A` (Grapefruit) | `#A97455` (Cinnamon) | `#FDFAF7` (Foam) | `#EDAC96` (Poetry Pink) |
| Indian | `#A97455` (Cinnamon) | `#E8734A` (Grapefruit) | `#FDFAF7` (Foam) | `#EDAC96` (Poetry Pink) |
| Thai | `#2B6B5E` (Amazonite) | `#A8C5B0` (Kalanchoe) | `#FDFAF7` (Foam) | `#EDAC96` (Poetry Pink) |
| Japanese | `#F5EDE6` (Sand) | `#EDAC96` (Poetry Pink) | `#3D3028` (Driftwood) | `#2B6B5E` (Amazonite) |
| Chinese | `#E8734A` (Grapefruit) | `#2B6B5E` (Amazonite) | `#FDFAF7` (Foam) | `#A97455` (Cinnamon) |
| Korean | `#A97455` (Cinnamon) | `#2B6B5E` (Amazonite) | `#FDFAF7` (Foam) | `#E8734A` (Grapefruit) |
| Mediterranean | `#2B6B5E` (Amazonite) | `#EDAC96` (Poetry Pink) | `#FDFAF7` (Foam) | `#A8C5B0` (Kalanchoe) |
| Middle Eastern | `#A97455` (Cinnamon) | `#EDAC96` (Poetry Pink) | `#FDFAF7` (Foam) | `#2B6B5E` (Amazonite) |
| American | `#EDAC96` (Poetry Pink) | `#E8734A` (Grapefruit) | `#3D3028` (Driftwood) | `#2B6B5E` (Amazonite) |
| French | `#EDAC96` (Poetry Pink) | `#A8C5B0` (Kalanchoe) | `#3D3028` (Driftwood) | `#A97455` (Cinnamon) |
| Ethiopian | `#A97455` (Cinnamon) | `#3D3028` (Driftwood) | `#FDFAF7` (Foam) | `#E8734A` (Grapefruit) |
| Caribbean | `#A8C5B0` (Kalanchoe) | `#E8734A` (Grapefruit) | `#FDFAF7` (Foam) | `#2B6B5E` (Amazonite) |
| Default | `#2B6B5E` (Amazonite) | `#A97455` (Cinnamon) | `#FDFAF7` (Foam) | `#EDAC96` (Poetry Pink) |

- **Storage:** Generated cards are stored in Supabase Storage under `text-covers/{recipe_id}.png`.
- **Regeneration:** If the recipe title or cuisine tags change, the text card is regenerated automatically.

#### 6.7.3 Visual Generation Queue

To avoid blocking the recipe creation flow:

- Image generation is **asynchronous**. The recipe is saved immediately with a placeholder shimmer state.
- A Supabase database webhook or pg_notify triggers the Edge Function.
- The client subscribes to Realtime updates on the recipe's `cover_image_url` field and swaps in the generated image when it arrives (typically 5–15 seconds for AI, <1 second for text card).

---

## 7. Tech Stack

### 7.1 Frontend

| Technology | Purpose | Notes |
|---|---|---|
| Next.js 14 (App Router) | Framework | Server Components by default; Server Actions for mutations |
| TypeScript | Language | Strict mode enabled |
| Tailwind CSS | Styling | Utility-first; shadcn/ui components; Coral Reef palette as custom theme tokens |
| Framer Motion | Animations & transitions | Card hover effects, page transitions, microinteractions |
| Plus Jakarta Sans + Playfair Display | Typography | Body + display fonts loaded via `next/font/google` |
| React Hook Form + Zod | Form handling | Client-side validation with schema enforcement |
| TanStack Query | Data fetching | Caching, optimistic updates for votes |
| `@vercel/og` (Satori) | Text card generation | Server-side OG-image-quality PNG generation for fallback covers |
| react-masonry-css | Masonry layout | Pinterest-style grid for recipe browse page |

### 7.2 Backend (Supabase)

| Service | Purpose | Notes |
|---|---|---|
| Supabase Auth | Authentication | Email/password, Google OAuth, magic links |
| Supabase Database (Postgres) | Primary data store | RLS policies for row-level security |
| Supabase Storage | Image hosting | User uploads, AI-generated covers, and text card PNGs |
| Supabase Realtime | Live updates | Real-time vote counts and cover image arrival on recipe pages |
| Supabase Edge Functions | Server-side logic | AI image generation, Wilson score recalculation, text card generation, moderation hooks |

### 7.3 Infrastructure & Tooling

| Tool | Purpose |
|---|---|
| Vercel | Hosting and CI/CD for Next.js |
| Supabase CLI | Local development, migrations, type generation |
| OpenAI API (DALL·E 3) | Primary AI image generation for recipes without photos |
| Stability AI / Replicate | Fallback image generation API (lower cost option) |
| PostHog or Plausible | Privacy-friendly analytics |
| Resend or Supabase SMTP | Transactional email (magic links, notifications) |
| GitHub Actions | Lint, test, and deploy pipeline |

---

## 8. Database Schema

All tables live in the `public` schema with Row Level Security (RLS) enabled.

### 8.1 profiles

Extends Supabase's `auth.users` with public profile data.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users) | Matches Supabase auth user ID |
| display_name | text | Shown on recipes and profile page |
| avatar_url | text | Supabase Storage path |
| bio | text | Max 300 chars |
| created_at | timestamptz | Default now() |

### 8.2 recipes

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default gen_random_uuid() |
| author_id | uuid (FK → profiles) | Recipe creator |
| title | text | Indexed for full-text search |
| description | text | Max 500 chars |
| cover_image_url | text | Supabase Storage path — user upload, AI-generated, or text card |
| is_cover_ai_generated | boolean | True if cover was auto-generated (AI or text card); false if user-uploaded |
| prep_time_minutes | int | |
| cook_time_minutes | int | |
| servings | int | |
| ingredients | jsonb | Array of {qty, unit, name} |
| instructions | jsonb | Array of {step, text, image_url?} |
| nutrition | jsonb | Optional: {calories, protein, carbs, fat} |
| vote_score | int | Denormalized net score; updated via trigger |
| wilson_score | float | For ranking; recalculated via trigger |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 8.3 tags & recipe_tags

**tags table:** id (uuid PK), name (text, unique), category (enum: allergy, preference, cuisine, mood), slug (text, unique).

**recipe_tags table:** recipe_id (FK), tag_id (FK), composite PK. This is a many-to-many join table.

### 8.4 votes

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| recipe_id | uuid (FK → recipes) | |
| value | smallint | +1 (upvote) or -1 (downvote) |
| created_at | timestamptz | Marks when recipe was "tried" |

Unique constraint on (user_id, recipe_id) ensures one vote per user per recipe.

### 8.5 bookmarks & collections

**bookmarks:** user_id (FK), recipe_id (FK), collection_id (FK, nullable), created_at. Composite unique on (user_id, recipe_id).

**collections:** id (uuid PK), user_id (FK), name (text), created_at.

---

## 9. Row Level Security (RLS) Policies

Every table has RLS enabled. Key policies:

| Table | Operation | Policy |
|---|---|---|
| profiles | SELECT | Public: anyone can read profiles |
| profiles | UPDATE | Owner only: auth.uid() = id |
| recipes | SELECT | Public: where is_deleted = false |
| recipes | INSERT | Authenticated: auth.uid() = author_id |
| recipes | UPDATE/DELETE | Owner only: auth.uid() = author_id |
| votes | SELECT | Owner only: auth.uid() = user_id |
| votes | INSERT/UPDATE/DELETE | Owner only: auth.uid() = user_id |
| bookmarks | ALL | Owner only: auth.uid() = user_id |

---

## 10. API & Data Layer

The application uses a hybrid data-fetching approach leveraging Next.js capabilities:

- **Server Components (RSC):** Recipe listings, detail pages, and profile pages fetch data server-side using the Supabase SSR client. This enables SEO-friendly rendering and fast initial loads.
- **Server Actions:** Mutations like creating/editing recipes, voting, and bookmarking use Next.js Server Actions with Zod validation. This eliminates the need for a custom API layer.
- **Client-side (TanStack Query):** Real-time vote count updates and optimistic UI for vote toggling are handled client-side with the Supabase browser client.
- **Supabase Realtime:** Subscribe to changes on the votes table to push live score updates to active recipe detail pages.

---

## 11. Step-by-Step Implementation Guide

This section provides a phased build plan, ordered by dependency. Each phase results in a working, testable increment.

### 11.1 Phase 1: Project Scaffolding & Auth (Days 1–3)

1. **Initialize the Next.js project**
   - `npx create-next-app@latest recipevault --typescript --tailwind --app --src-dir`
   - Install core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `framer-motion`, `react-masonry-css`
   - Install shadcn/ui: `npx shadcn-ui@latest init` (New York style, customize with Coral Reef palette)
   - Configure Coral Reef palette in `tailwind.config.ts` (see Appendix 14.5) and `globals.css` with CSS custom properties
   - Set up typography: load **Plus Jakarta Sans** and **Playfair Display** via `next/font/google` in root layout
   - Add linen texture asset to `public/textures/`

2. **Set up Supabase project**
   - Create project at supabase.com; note the Project URL and anon key
   - Install Supabase CLI: `npm install -g supabase`
   - Run `supabase init` and `supabase link` to connect local dev to your project
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

3. **Configure Supabase SSR client helpers**
   - Create `src/lib/supabase/server.ts` with `createServerClient` (cookies-based)
   - Create `src/lib/supabase/client.ts` with `createBrowserClient`
   - Create `middleware.ts` to refresh auth tokens on each request using Supabase's recommended middleware pattern

4. **Build authentication pages**
   - Create `/login` and `/signup` pages with email/password forms
   - Enable Google OAuth in Supabase dashboard; add the provider button
   - Enable magic links in Supabase; add the option to the login page
   - Build the `/auth/callback` route handler for OAuth and magic link redirects
   - Create a global `AuthProvider` context that exposes session state and sign-out

5. **Create the profiles table and trigger**
   - Write a Supabase migration: create `profiles` table with RLS policies
   - Create a database trigger function that auto-creates a profile row on `auth.users` INSERT
   - Build a `/profile/edit` page for display name, avatar upload (Supabase Storage), and bio

> **Checkpoint:** Users can sign up, log in, upload an avatar, and see their profile.

### 11.2 Phase 2: Database Schema & Tags (Days 4–6)

1. **Create the full database schema via migrations**
   - Migration 1: `recipes` table with all columns, indexes on title (GIN for full-text), author_id, created_at, wilson_score
   - Migration 2: `tags` table seeded with all predefined tags; `recipe_tags` join table
   - Migration 3: `votes` table with unique constraint on (user_id, recipe_id)
   - Migration 4: `bookmarks` and `collections` tables
   - Migration 5: RLS policies for all tables (per Section 9)

2. **Create database triggers and functions**
   - Trigger on votes INSERT/UPDATE/DELETE that recalculates `recipe.vote_score` (SUM of value) and `recipe.wilson_score` (Wilson interval)
   - Function: `calculate_wilson_score(ups int, downs int) RETURNS float`

3. **Seed tag data**
   - Write a seed script or migration that inserts all tags from Section 6.3 with correct categories

4. **Generate TypeScript types**
   - Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts`
   - Create a typed Supabase client helper that infers from these types

> **Checkpoint:** Database is fully provisioned and type-safe. Can verify via Supabase dashboard.

### 11.3 Phase 3: Recipe CRUD (Days 7–10)

1. **Build the recipe creation form**
   - Create `/recipes/new` as a client component with React Hook Form + Zod schema
   - Implement the structured ingredient input: dynamic rows with qty, unit (dropdown), and ingredient name fields
   - Implement the instruction steps: numbered, reorderable (drag-and-drop or up/down arrows), each with a textarea and optional image upload
   - Implement the tag selector: grouped checkboxes organized by category (allergy, preference, cuisine, mood)
   - Cover image upload: drag-and-drop zone that uploads to Supabase Storage on selection

2. **Create the Server Action for recipe submission**
   - Validate all fields server-side with Zod
   - Insert into `recipes` table; then bulk-insert into `recipe_tags`
   - Redirect to the new recipe's detail page on success

3. **Build the recipe detail page**
   - Create `/recipes/[id]/page.tsx` as a Server Component
   - Fetch recipe with joined author profile, tags, and current vote score
   - Render: cover image hero, metadata bar (prep/cook time, servings), ingredient list, step-by-step instructions, nutrition panel, tags
   - Add structured data (JSON-LD) for SEO and rich snippets in search engines

4. **Build edit and delete flows**
   - Create `/recipes/[id]/edit` that pre-fills the form with existing data
   - Server Action for update (validates ownership via `auth.uid()`)
   - Soft-delete Server Action that sets `is_deleted = true`

> **Checkpoint:** Users can create, view, edit, and delete their own recipes with images and tags.

### 11.4 Phase 4: Browse, Search & Filter (Days 11–14)

1. **Build the recipe listing page**
   - Create `/recipes/page.tsx` as a Server Component that reads URL search params for filters and sort
   - Implement masonry grid layout using `react-masonry-css` for a Pinterest-style visual feed
   - Recipe cards per Section 5.0.4: full-bleed image hero, Coral Reef floating badges, warm gradient overlay, hover interactions
   - Implement cursor-based pagination (20 per page) using created_at or wilson_score as cursor
   - Add Framer Motion `AnimatePresence` for staggered card entrance animations

2. **Implement full-text search**
   - Add a GIN index on a generated tsvector column combining title, description, and ingredient names
   - Create a Postgres function: `search_recipes(query text)` that uses `ts_query` with ranking
   - Wire the search bar to update URL params; the Server Component re-fetches with the query

3. **Build the tag filter panel**
   - Desktop: collapsible sidebar with tag groups; each group is an accordion section
   - Mobile: bottom sheet (or drawer) triggered by a filter icon
   - Selecting tags updates URL search params (e.g., `?allergy=gluten-free,nut-free&cuisine=italian`)
   - Server-side query joins `recipe_tags` and filters using ALL (AND logic within category) or ANY (OR for mood tags)

4. **Add sort controls**
   - Dropdown with: Newest, Most Upvoted (wilson_score DESC), Most Tried (vote count DESC), Fastest (prep + cook ASC)
   - Sorting updates URL params; Server Component re-fetches accordingly

> **Checkpoint:** Users can browse, search, and filter recipes with responsive UX across devices.

### 11.5 Phase 5: Voting & Bookmarking (Days 15–18)

1. **Build the vote component**
   - Client component: upvote/downvote buttons with current score displayed between them
   - **Microinteractions:** Upvote button bounces and fills green on click; downvote bounces and fills red. Score counter animates (rolls up/down) on change. Use Framer Motion `spring` animations.
   - Fetch the user's existing vote (if any) on mount to set initial UI state
   - Optimistic update via TanStack Query: update the UI immediately, then fire the Server Action
   - Server Action: UPSERT into votes table (insert if new, update if changing direction, delete if toggling off)
   - The database trigger recalculates `vote_score` and `wilson_score` on the recipe row

2. **Enable Supabase Realtime for vote counts**
   - Subscribe to changes on `recipes.vote_score` for the current recipe ID
   - Update the displayed score in real-time when other users vote

3. **Build the bookmark feature**
   - Bookmark icon (heart or flag) on recipe cards and detail page
   - Server Action: INSERT/DELETE from bookmarks table
   - Optimistic toggle on the client

4. **Build collections management**
   - Allow users to create named collections from their dashboard
   - When bookmarking, show a dropdown to assign to a collection (or "Unsorted")

> **Checkpoint:** Users can vote, bookmark, and organize recipes. Votes update in real-time.

### 11.6 Phase 6: User Dashboard & History (Days 19–22)

1. **Build the user dashboard (`/dashboard`)**
   - Tab layout: My Recipes | Saved | Liked | Disliked
   - My Recipes: grid of user's uploaded recipes with edit/delete actions
   - Saved: bookmarked recipes, grouped by collection
   - Liked: recipes the user upvoted (joined on votes WHERE value = 1)
   - Disliked: recipes the user downvoted (joined on votes WHERE value = -1)

2. **Build public profile pages (`/users/[id]`)**
   - Display name, avatar, bio, and a grid of their public recipes
   - Recipe count and total upvotes received stats

3. **Add recipe status indicators**
   - On recipe cards throughout the app, show subtle indicators: a filled bookmark icon if saved, a green/red dot if liked/disliked
   - These indicators require checking the user's votes and bookmarks; batch-load in list queries for performance

> **Checkpoint:** Users have a complete personal dashboard with full recipe history.

### 11.7 Phase 7: Auto-Generated Visuals (Days 23–26)

1. **Build the styled text card generator**
   - Create an API route at `/api/og/recipe/[id]` using `@vercel/og` (Satori)
   - Implement the Coral Reef cuisine-to-gradient map (see Section 6.7.2) in `src/lib/visuals/cuisine-palettes.ts`
   - Design the text card template per Appendix 14.4: Playfair Display title, Coral Reef gradient background, ingredient emoji, time pill, linen texture overlay
   - Generate a 1200×630px PNG and upload to Supabase Storage under `text-covers/`
   - Test all 14 cuisine palettes and edge cases (long titles, missing tags, default fallback)

2. **Build the AI image generation Edge Function**
   - Create a Supabase Edge Function: `generate-recipe-cover`
   - Implement prompt construction from recipe title, cuisine tags, and top ingredients
   - Call OpenAI DALL·E 3 API (or Stability AI as fallback) with food photography prompt template
   - Save generated image to Supabase Storage under `generated-covers/`
   - Update the recipe's `cover_image_url` and set `is_cover_ai_generated = true`
   - Add error handling: if AI generation fails, fall back to text card generator

3. **Wire up the async generation pipeline**
   - Create a database trigger on recipes INSERT/UPDATE: when `cover_image_url IS NULL`, invoke the Edge Function via `pg_net` or a database webhook
   - On the client, subscribe to Realtime changes on the recipe's `cover_image_url` field
   - Show a shimmer/skeleton placeholder while the image is being generated
   - Swap in the generated image with a fade-in animation when it arrives

4. **Add the "AI-generated" badge and override flow**
   - Display a small semi-transparent badge on AI-generated covers: "AI-generated image"
   - On the recipe edit page, if `is_cover_ai_generated = true`, show a prominent "Upload your own photo" CTA
   - When a user uploads their own photo, delete the generated image from Storage and reset the flag

> **Checkpoint:** Every recipe in the system has a visual. Recipes without user photos get beautiful auto-generated covers within seconds.

### 11.8 Phase 8: Visual Polish, Performance & Launch (Days 27–32)

1. **Animation and interaction pass**
   - Implement card hover effects: subtle scale (1.02), warm Cinnamon-toned shadow elevation (`shadow-warm-lg`), and quick-action overlay fade-in using Framer Motion
   - Add page transition animations using `AnimatePresence` and `layoutId` for shared-element transitions between recipe cards and detail pages
   - Implement skeleton loading states with Poetry Pink → Sand shimmer gradient that matches the exact layout of recipe cards, detail pages, and dashboard tabs
   - Add dark mode: Deep Sea background, adjust image overlays (slight brightness reduction), swap text to Foam, ensure all Coral Reef accent colors maintain WCAG AA contrast
   - Tag chip animations: ripple on selection, smooth slide-in for applied filter chips
   - Vote button microinteractions: spring bounce, Grapefruit/Cinnamon color fill, score counter roll animation

2. **Performance optimization**
   - Add Supabase database indexes: GIN on tags, B-tree on wilson_score, composite on (user_id, recipe_id) for votes
   - Implement Next.js `Image` component for all recipe images with proper sizing and lazy loading
   - Add `loading.tsx` skeletons for all major pages
   - Verify Server Component usage: ensure no unnecessary client components

2. **SEO and metadata**
   - Add `generateMetadata` to recipe detail pages with Open Graph images
   - Create a `sitemap.xml` route for all public recipes
   - Structured data (JSON-LD Recipe schema) on every recipe page

3. **Responsive design audit**
   - Test all pages at mobile (375px), tablet (768px), and desktop (1280px) breakpoints
   - Ensure the tag filter panel, recipe form, and dashboard tabs work well on all sizes

4. **Error handling and edge cases**
   - Error boundaries with `error.tsx` for graceful failures
   - Not-found pages with `not-found.tsx`
   - Rate limiting on recipe creation and voting (Supabase Edge Function or middleware)

5. **Analytics and monitoring**
   - Integrate PostHog or Plausible for page views, filter usage, and funnel tracking
   - Set up Supabase dashboard alerts for auth failures and storage limits

6. **Deploy to production**
   - Push to Vercel with environment variables configured
   - Set up a custom domain
   - Run all Supabase migrations against the production database
   - Smoke-test the full user journey: sign up → create recipe → browse → vote → bookmark → dashboard

> **Checkpoint:** Production-ready application deployed and accessible.

---

## 12. Future Enhancements (Post-MVP)

- **Comments & Discussion:** Threaded comments on recipes for tips, substitutions, and reviews.
- **AI-Powered Suggestions:** Recommendation engine based on voting history and tag affinity (collaborative filtering).
- **Video Steps:** Allow users to upload short video clips per instruction step, with auto-thumbnail generation.
- **Meal Planner:** Weekly calendar view where users drag-and-drop saved recipes into meal slots with auto-generated shopping lists.
- **Recipe Forking:** Allow users to "fork" an existing recipe to create their own variation, maintaining attribution.
- **Nutritional API Integration:** Auto-calculate nutrition from ingredient list via Edamam or Nutritionix API.
- **Social Features:** Follow users, activity feed, notifications when a followed user uploads a new recipe.
- **Step-by-Step Cooking Mode:** Full-screen, swipe-through instruction view with large text, timer integration, and voice control ("next step").
- **Mobile App:** React Native or Expo wrapper for native mobile experience with offline recipe caching.
- **Moderation Dashboard:** Admin panel for flagged content review, user reports, and content moderation workflows.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Low initial recipe volume | High | Seed the platform with 50–100 curated recipes before launch; invite food bloggers to early access |
| Vote manipulation | Medium | Rate limiting on votes; anomaly detection on voting patterns; require verified email |
| Image storage costs | Medium | Compress and resize on upload (max 1200px width); set Supabase Storage lifecycle policies |
| AI image generation costs | Medium | Rate-limit to 1 generation per recipe; cache permanently; use text card fallback when budget threshold hit; batch generation during off-peak |
| Tag sprawl / misuse | Low | Admin-managed tag list for MVP (no user-created tags); community nominations for new tags in v2 |
| Allergen mistagging | High | Prominent disclaimer that tags are user-reported; encourage community flagging of incorrect tags |

---

## 14. Appendix

### 14.1 Recommended Project Structure

```
src/
  app/
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (auth)/auth/callback/route.ts
    api/og/recipe/[id]/route.tsx  # Text card generation endpoint
    recipes/page.tsx              # Browse/search (masonry grid)
    recipes/new/page.tsx          # Create
    recipes/[id]/page.tsx         # Detail (hero image, parallax)
    recipes/[id]/edit/page.tsx    # Edit
    dashboard/page.tsx            # User dashboard
    users/[id]/page.tsx           # Public profile
    layout.tsx
    globals.css
  components/
    ui/                           # shadcn components
    recipes/                      # RecipeCard, RecipeForm, VoteButton, BookmarkButton
    visuals/                      # TextCardPreview, ImagePlaceholder, AiBadge
    layout/                       # Navbar, Footer, Sidebar, MasonryGrid
    animations/                   # Page transitions, shared-element configs
  lib/
    supabase/server.ts            # SSR client
    supabase/client.ts            # Browser client
    supabase/database.types.ts    # Generated types
    visuals/
      cuisine-palettes.ts         # Coral Reef gradient config per cuisine tag
      prompt-builder.ts           # AI image prompt construction
      text-card-template.tsx      # Satori JSX template for text cards
    validators/                   # Zod schemas
    actions/                      # Server Actions
  hooks/                          # Custom React hooks (useVote, useBookmark, useRealtimeCover)
  styles/
    globals.css                   # CSS custom properties for Coral Reef palette
public/
  textures/
    linen.png                     # Subtle linen texture for text cards and backgrounds
supabase/
  functions/
    generate-recipe-cover/        # Edge Function for AI image generation
  migrations/                     # All SQL migrations
```

### 14.2 Wilson Score SQL Function

```sql
CREATE FUNCTION calculate_wilson_score(ups int, downs int)
RETURNS float AS $$
  SELECT CASE WHEN ups + downs = 0 THEN 0
  ELSE (ups + 1.9208) / (ups + downs)
    - 1.96 * SQRT((ups * downs) / (ups + downs) + 0.9604)
    / (ups + downs)
    / (1 + 3.8416 / (ups + downs))
  END;
$$ LANGUAGE SQL IMMUTABLE;
```

### 14.3 AI Image Prompt Template

```
A beautifully plated {recipe_title}, {cuisine_style} cuisine, 
overhead shot, natural window lighting, on a rustic {surface_material} surface, 
garnished with fresh herbs, shallow depth of field, 
professional food photography, 8k, appetizing
```

Variables are filled from recipe data: `recipe_title` from the title field, `cuisine_style` from the primary cuisine tag, `surface_material` randomly selected from ["wooden table", "marble countertop", "ceramic plate on linen", "slate board"].

### 14.4 Text Card Satori Template Reference

The `@vercel/og` text card uses this JSX structure, pulling from the Coral Reef cuisine-gradient map:

```tsx
// palette = cuisineGradientMap[recipe.cuisine] or default
<div style={{
  width: 1200, height: 630,
  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`,
  padding: 60,
  fontFamily: 'Playfair Display',
}}>
  {/* Linen texture overlay */}
  <div style={{
    position: 'absolute', inset: 0, opacity: 0.06,
    backgroundImage: 'url(/textures/linen.png)', backgroundRepeat: 'repeat',
  }} />
  <div style={{ fontSize: 52, fontWeight: 700, color: palette.text, textAlign: 'center', lineHeight: 1.2 }}>
    {recipe.title}
  </div>
  <div style={{ fontSize: 28, marginTop: 24, opacity: 0.85, color: palette.text }}>
    {ingredientEmojis.join('  ')}
  </div>
  <div style={{
    fontSize: 18, marginTop: 32, padding: '8px 20px', borderRadius: 20,
    background: palette.accent, color: palette.text, opacity: 0.9,
  }}>
    {recipe.prep_time_minutes + recipe.cook_time_minutes} min · {recipe.servings} servings
  </div>
</div>
```

### 14.5 Tailwind Theme Config Reference

```ts
// tailwind.config.ts (partial)
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        kalanchoe:     "#A8C5B0",
        amazonite:     "#2B6B5E",
        "poetry-pink": "#EDAC96",
        grapefruit:    "#E8734A",
        cinnamon:      "#A97455",
        sand:          "#F5EDE6",
        driftwood:     "#3D3028",
        foam:          "#FDFAF7",
        "deep-sea":    "#1A2E2A",
        "moonlit-sand":"#D4C5B9",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body:    ["Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        warm:   "0 4px 14px rgba(169, 116, 85, 0.10)",
        "warm-lg": "0 10px 30px rgba(169, 116, 85, 0.15)",
      },
    },
  },
};
export default config;
```
