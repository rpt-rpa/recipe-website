# n8n — recommendation engine

The recommendation engine is an n8n workflow: **Webhook (POST) → Engine (Code) →
Respond to Webhook**. It's a *stateless scoring function* — the client enriches
the request with the user's profile + recent history (all RLS-safe reads), so
n8n needs **no Supabase service-role key**.

- **Deployed workflow:** `imhungry` (id `ScDcVTDSW1KXHtUv`) on the user's n8n cloud.
- **Production URL:** `https://lightningvision.app.n8n.cloud/webhook/06eb28a9-0438-4ab0-b82a-b9d9e81e8f04`
  (stored client-side as `NEXT_PUBLIC_N8N_WEBHOOK_URL`).

## Files

| File | Purpose |
|------|---------|
| `engine.js` | Readable source of the Code-node engine (catalog + scoring rules). |
| `build-sdk.mjs` | Emits `workflow.sdk.ts` — n8n Workflow SDK code with `engine.js` embedded. |
| `workflow.sdk.ts` | Generated SDK code (used to create/update the workflow via the n8n MCP). |
| `build-workflow.mjs` | Emits `recommendation-workflow.json` — a plain importable workflow as a fallback. |
| `recommendation-workflow.json` | Generated; import via n8n editor → "Import from File". |

> The deployed Code node uses a whitespace-compacted equivalent of `engine.js`;
> the logic is identical. Re-deploy by regenerating with `build-sdk.mjs` and
> calling the n8n MCP `update_workflow` (then `publish_workflow`).

## Request / response

**Request** (POST body, enriched intent):

```json
{ "user_id", "session_id", "mode", "surprise", "hunger_level",
  "time_available_mins", "budget", "cravings", "format_pref",
  "day_of_week", "hour_of_day",
  "profile": { "allergies", "dietary_restrictions", "preferred_cuisines",
               "disliked_foods", "pantry_staples", "budget_range" },
  "recently_eaten": [], "session_count": 0 }
```

**Response:** ranked JSON array of `{ type, dish_name, cuisine, est_time_mins,
est_cost_range, deep_link, recipe_steps, rating, rank }`.

## Engine rules (in `engine.js`)

- **Allergy/dietary HARD filter** — never overridden (safety).
- Speed weighting (hungry / low time), cravings boost, format bias, budget
  filter, learned-preference boost/penalty, meal-period nudge, repeat penalty.
- **Recall-first explore/exploit** — `LEARNING_CONFIG.exploration_rate` decays
  with `session_count`; reserves a wildcard slot while cold.
- **Ratings** resolve through `resolveRating()` (first-party beats external);
  weights in `RATING_CONFIG`.
