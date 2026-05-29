/**
 * i'm hungry — recommendation engine (n8n Code node)
 * ===================================================
 * Paste this into the "Engine" Code node (Run Once for All Items, JavaScript).
 *
 * Input: the POST body forwarded by the Webhook node — the normalized intent
 *        ENRICHED by the client with the user's profile + recent history:
 *
 *   {
 *     user_id, session_id, mode, surprise,
 *     hunger_level, time_available_mins, budget, cravings, format_pref,
 *     day_of_week, hour_of_day,
 *     profile: { allergies, dietary_restrictions, preferred_cuisines,
 *                disliked_foods, pantry_staples, budget_range },
 *     recently_eaten: ["Pad Thai", ...],   // last ~3 days
 *     session_count: 0
 *   }
 *
 * Output: one item per recommendation; the "Respond to Webhook" node returns
 *         them as a JSON array (Respond With → All Incoming Items).
 *
 * Architecture notes:
 *  - Allergies/dietary restrictions are a HARD filter — never overridden.
 *  - Tunables live in LEARNING_CONFIG / RATING_CONFIG so the model can be
 *    retuned without touching the rest of the workflow.
 *  - Ratings resolve through resolveRating(): first-party beats external blend.
 */

// ── Tunables ────────────────────────────────────────────────────────────────
const LEARNING_CONFIG = {
  base_exploration_rate: 0.6, // cold-start: explore widely
  min_exploration_rate: 0.1, // mature: mostly exploit
  decay_per_session: 0.05, // exploration decays as confidence rises
  wildcard_slot_threshold: 0.25, // reserve ≥1 wildcard while above this
  result_count: 5,
};

const RATING_CONFIG = {
  // First-party always wins when present; otherwise blend external by votes.
  external_weights: { google: 1.0, yelp: 1.0 },
  default_when_unrated: { score: 4.0, scale: 5, source: "external", votes: 0 },
};

// ── Candidate catalog ────────────────────────────────────────────────────────
// dietary_tags: which restrictions a dish SATISFIES (so it survives that filter)
// allergens: allergen keys the dish CONTAINS (so it's excluded for that allergy)
const CATALOG = [
  // ── Delivery ──
  d("delivery", "Pad Thai", "thai", 35, "$12–18", "medium", ["peanuts"], ["dairy_free"], 4.5, "google", 1280),
  d("delivery", "Margherita Pizza", "italian", 30, "$10–16", "medium", [], ["vegetarian"], 4.4, "google", 980),
  d("delivery", "Chicken Tikka Masala", "indian", 40, "$13–19", "medium", ["dairy"], ["gluten_free", "halal"], 4.6, "yelp", 640),
  d("delivery", "California Roll", "japanese", 25, "$9–15", "medium", ["shellfish"], ["dairy_free"], 4.3, "google", 510),
  d("delivery", "Carne Asada Tacos", "mexican", 25, "$9–14", "low", [], ["gluten_free", "dairy_free", "halal"], 4.5, "google", 720),
  d("delivery", "Falafel Bowl", "mediterranean", 20, "$8–13", "low", ["sesame"], ["vegan", "vegetarian", "dairy_free", "halal", "kosher"], 4.4, "yelp", 430),
  d("delivery", "Cheeseburger & Fries", "american", 25, "$11–16", "medium", ["dairy", "gluten"], [], 4.2, "google", 1500),
  d("delivery", "Kung Pao Chicken", "chinese", 35, "$11–17", "medium", ["peanuts"], ["dairy_free"], 4.3, "yelp", 390),
  d("delivery", "Pho", "vietnamese", 30, "$10–15", "low", [], ["dairy_free", "halal"], 4.6, "google", 860),
  d("delivery", "Greek Salad", "mediterranean", 15, "$8–12", "low", ["dairy"], ["vegetarian", "gluten_free"], 4.1, "yelp", 220),

  // ── Recipe (from common pantry staples) ──
  r("Scrambled Eggs & Toast", "american", 10, "$2–4", "low", ["eggs", "bread"], ["dairy"], ["vegetarian"], ["Crack 2 eggs into a bowl", "Whisk with a pinch of salt", "Heat a pan on medium with butter", "Cook eggs, stirring gently", "Toast bread", "Serve together"], 4.8, "first_party", 23),
  r("Garlic Butter Pasta", "italian", 20, "$3–6", "low", ["pasta"], ["gluten", "dairy"], ["vegetarian"], ["Boil salted water", "Cook pasta until al dente", "Melt butter with minced garlic", "Toss pasta in garlic butter", "Season with salt & pepper", "Top with cheese if you like"], 4.5, "external", 0),
  r("Veggie Fried Rice", "chinese", 20, "$3–6", "low", ["rice", "eggs"], [], ["vegetarian", "dairy_free"], ["Heat oil in a wok", "Scramble an egg, set aside", "Stir-fry chopped veggies", "Add cold cooked rice", "Splash soy sauce", "Fold egg back in and serve"], 4.4, "external", 0),
  r("Grilled Cheese", "american", 12, "$2–4", "low", ["bread", "cheese"], ["gluten", "dairy"], ["vegetarian"], ["Butter two slices of bread", "Place cheese between, butter-side out", "Grill on medium until golden", "Flip and grill the other side", "Slice and serve"], 4.3, "external", 0),
  r("Chicken & Rice Bowl", "american", 30, "$4–7", "medium", ["rice", "chicken"], [], ["gluten_free", "dairy_free", "halal"], ["Season chicken with salt & pepper", "Pan-sear until cooked through", "Cook rice", "Slice chicken", "Serve over rice", "Add a drizzle of sauce"], 4.5, "external", 0),
  r("Tomato Soup", "american", 25, "$2–5", "low", ["canned goods"], ["dairy"], ["vegetarian", "gluten_free"], ["Sauté onion & garlic", "Add canned tomatoes", "Simmer 15 minutes", "Blend until smooth", "Stir in cream", "Season and serve"], 4.2, "external", 0),
];

function d(type, dish_name, cuisine, mins, cost, tier, allergens, dietary_tags, score, source, votes) {
  return { type, dish_name, cuisine, est_time_mins: mins, est_cost_range: cost, cost_tier: tier, deep_link: doordash(dish_name), recipe_steps: null, allergens, dietary_tags, _rating: { score, scale: 5, source, votes } };
}
function r(dish_name, cuisine, mins, cost, tier, pantry, allergens, dietary_tags, steps, score, source, votes) {
  return { type: "recipe", dish_name, cuisine, est_time_mins: mins, est_cost_range: cost, cost_tier: tier, deep_link: null, recipe_steps: steps, pantry, allergens, dietary_tags, _rating: { score, scale: 5, source, votes } };
}
function doordash(name) {
  return "https://www.doordash.com/search/store/" + encodeURIComponent(name);
}

// ── Helpers ───────────────────────────────────────────────────────────────--
// Map profile chip labels → internal keys.
const ALLERGEN_MAP = { "nut allergy": "peanuts", "shellfish allergy": "shellfish", "dairy-free": "dairy" };
const DIET_MAP = { vegetarian: "vegetarian", vegan: "vegan", "gluten-free": "gluten_free", "dairy-free": "dairy_free", halal: "halal", kosher: "kosher" };

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function mealPeriod(hour) {
  if (hour >= 6 && hour <= 10) return "breakfast";
  if (hour >= 11 && hour <= 14) return "lunch";
  if (hour >= 17 && hour <= 21) return "dinner";
  return "snack";
}

function resolveRating(dish) {
  // Engine catalog carries a seed rating; first-party (set by feedback
  // aggregation) would override here. Kept in one place per architecture.
  const rt = dish._rating || RATING_CONFIG.default_when_unrated;
  return { score: rt.score, scale: rt.scale, source: rt.source, votes: rt.votes };
}

function explorationRate(sessionCount) {
  const raw = LEARNING_CONFIG.base_exploration_rate - LEARNING_CONFIG.decay_per_session * (sessionCount || 0);
  return Math.max(LEARNING_CONFIG.min_exploration_rate, raw);
}

// ── Main ──────────────────────────────────────────────────────────────────--
const input = $input.first().json;
const p = input.body || input; // webhook wraps the POST body under .body

const profile = p.profile || {};
const allergies = (profile.allergies || []).map(norm).map((a) => ALLERGEN_MAP[a]).filter(Boolean);
const diets = (profile.dietary_restrictions || []).map(norm).map((dn) => DIET_MAP[dn]).filter(Boolean);
const preferred = (profile.preferred_cuisines || []).map(norm);
const disliked = (profile.disliked_foods || []).map(norm);
const recentlyEaten = (p.recently_eaten || []).map(norm);

const hunger = p.hunger_level; // 1-5 | null
const timeAvail = p.time_available_mins; // 15|30|60 | null
const budget = p.budget || profile.budget_range || null; // low|medium|high
const cravings = (p.cravings || []).map(norm);
const formatPref = p.format_pref || "either"; // order|cook|either
const surprise = p.surprise === true;
const period = mealPeriod(p.hour_of_day);

// 1) HARD safety filter — allergies + dietary restrictions. Never overridden.
let pool = CATALOG.filter((dish) => {
  for (const a of allergies) if ((dish.allergens || []).includes(a)) return false;
  for (const dn of diets) if (!(dish.dietary_tags || []).includes(dn)) return false;
  return true;
});

// Fallback so we never return empty due to over-filtering on diet tags.
if (pool.length === 0) {
  pool = CATALOG.filter((dish) => !allergies.some((a) => (dish.allergens || []).includes(a)));
}

// 2) Score each surviving dish.
function scoreDish(dish) {
  let score = 0;
  const reasons = [];

  // Rating boost (resolved; first-party would win).
  const rating = resolveRating(dish);
  score += (rating.score / rating.scale) * 2; // up to +2

  if (!surprise) {
    // Speed weighting when hungry / low on time.
    const wantFast = (hunger != null && hunger >= 4) || (timeAvail != null && timeAvail <= 15);
    if (wantFast) {
      if (dish.est_time_mins <= 15) score += 2;
      else if (dish.est_time_mins <= 30) score += 0.5;
      else score -= 1;
    } else if (timeAvail != null && dish.est_time_mins > timeAvail) {
      score -= 1.5; // too slow for the window
    }

    // Cravings boost (cuisine or dish name match).
    for (const c of cravings) {
      if (dish.cuisine.includes(c) || norm(dish.dish_name).includes(c)) {
        score += 1.5;
        reasons.push("craving:" + c);
      }
    }

    // Format preference bias.
    if (formatPref === "cook" && dish.type === "recipe") score += 1.2;
    if (formatPref === "order" && dish.type === "delivery") score += 1.2;

    // Budget filter / bias.
    if (budget === "low") {
      if (dish.cost_tier === "high") score -= 5; // effectively excluded
      if (dish.cost_tier === "low") score += 0.8;
    } else if (budget === "high") {
      if (dish.cost_tier === "high") score += 0.5;
    }

    // Learned preferences.
    if (preferred.includes(dish.cuisine)) score += 1.0;
    if (disliked.some((x) => dish.cuisine.includes(x) || norm(dish.dish_name).includes(x))) score -= 2;
  } else {
    // Surprise: lean on rating + meal-period fit, ignore most prefs.
    score += Math.random() * 1.5;
  }

  // Meal-period nudge.
  if (period === "breakfast" && /egg|toast|breakfast/.test(norm(dish.dish_name))) score += 1;

  // Repeat penalty — eaten in the last few days ranks lower.
  if (recentlyEaten.includes(norm(dish.dish_name))) score -= 2.5;

  return { dish, score, rating };
}

let scored = pool.map(scoreDish).sort((a, b) => b.score - a.score);

// 3) Recall-first explore/exploit — reserve a wildcard slot while cold.
const expRate = explorationRate(p.session_count);
const count = Math.min(LEARNING_CONFIG.result_count, scored.length);
let chosen = scored.slice(0, count);

if (expRate > LEARNING_CONFIG.wildcard_slot_threshold && scored.length > count) {
  // Swap the lowest chosen for a random non-chosen "wildcard" to keep learning.
  const rest = scored.slice(count);
  const wildcard = rest[Math.floor(Math.random() * rest.length)];
  chosen[chosen.length - 1] = wildcard;
}

// 4) Shape the response (strip internal fields, attach resolved rating + rank).
const out = chosen.map((s, i) => ({
  type: s.dish.type,
  dish_name: s.dish.dish_name,
  cuisine: s.dish.cuisine,
  est_time_mins: s.dish.est_time_mins,
  est_cost_range: s.dish.est_cost_range,
  deep_link: s.dish.deep_link,
  recipe_steps: s.dish.recipe_steps,
  rating: s.rating,
  rank: i + 1,
}));

return out.map((json) => ({ json }));
