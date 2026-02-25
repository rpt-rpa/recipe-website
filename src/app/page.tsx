export default function Home() {
  return (
    <div className="min-h-screen bg-sand text-driftwood">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-grapefruit text-foam font-display font-bold text-lg">
            R
          </div>
          <span className="font-display text-xl font-bold text-amazonite">
            RecipeVault
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-full border border-amazonite px-5 py-2 text-sm font-medium text-amazonite transition-colors hover:bg-amazonite/10">
            Log In
          </button>
          <button className="rounded-full bg-grapefruit px-5 py-2 text-sm font-medium text-foam transition-colors hover:brightness-110">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center md:px-12 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-kalanchoe/30 px-4 py-1.5 text-sm font-medium text-amazonite">
            Visual-first recipe sharing
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-driftwood md:text-6xl lg:text-7xl">
            Every recipe deserves to{" "}
            <span className="text-grapefruit">look delicious</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cinnamon">
            Discover, save, and share beautiful recipes. Filter by allergies,
            dietary needs, cuisine, or mood. Track what you&apos;ve tried and
            loved.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button className="w-full rounded-full bg-grapefruit px-8 py-3.5 text-base font-semibold text-foam shadow-warm transition-all hover:shadow-warm-lg hover:brightness-110 sm:w-auto">
              Start Exploring
            </button>
            <button className="w-full rounded-full border border-cinnamon/30 px-8 py-3.5 text-base font-semibold text-amazonite transition-colors hover:bg-foam sm:w-auto">
              Share a Recipe
            </button>
          </div>
        </div>
      </section>

      {/* Mock Recipe Cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockRecipes.map((recipe) => (
            <RecipeCard key={recipe.title} {...recipe} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-foam py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <h2 className="text-center font-display text-3xl font-bold text-driftwood md:text-4xl">
            Built for home cooks
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-cinnamon">
            Everything you need to discover your next favorite meal, without the
            ads and blog posts.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-kalanchoe/25 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-driftwood">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cinnamon">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tag Discovery Section */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-12">
        <h2 className="text-center font-display text-3xl font-bold text-driftwood md:text-4xl">
          Find exactly what you&apos;re craving
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-cinnamon">
          Filter by allergy, diet, cuisine, or mood — combine them however you
          like.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {sampleTags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-4 py-2 text-sm font-medium ${tag.className}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-amazonite py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-bold text-foam md:text-4xl">
            Ready to cook something amazing?
          </h2>
          <p className="mt-4 text-poetry-pink">
            Join RecipeVault and start building your personal cookbook today.
          </p>
          <button className="mt-8 rounded-full bg-grapefruit px-10 py-4 text-lg font-semibold text-foam shadow-warm-lg transition-all hover:brightness-110">
            Get Started — It&apos;s Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cinnamon/15 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-grapefruit text-foam font-display font-bold text-sm">
              R
            </div>
            <span className="font-display text-base font-bold text-amazonite">
              RecipeVault
            </span>
          </div>
          <p className="text-sm text-moonlit-sand">
            &copy; 2026 RecipeVault. Made with love for home cooks.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Mock Data ─── */

const mockRecipes = [
  {
    title: "Spicy Thai Basil Chicken",
    cuisine: "Thai",
    time: "25 min",
    score: 142,
    gradientFrom: "from-amazonite",
    gradientTo: "to-kalanchoe",
    tags: ["Gluten-Free", "Quick Weeknight"],
  },
  {
    title: "Creamy Tuscan Pasta",
    cuisine: "Italian",
    time: "35 min",
    score: 98,
    gradientFrom: "from-grapefruit",
    gradientTo: "to-poetry-pink",
    tags: ["Vegetarian", "Comfort Food"],
  },
  {
    title: "Miso Glazed Salmon",
    cuisine: "Japanese",
    time: "30 min",
    score: 76,
    gradientFrom: "from-cinnamon",
    gradientTo: "to-poetry-pink",
    tags: ["Pescatarian", "Healthy"],
  },
];

function RecipeCard({
  title,
  cuisine,
  time,
  score,
  gradientFrom,
  gradientTo,
  tags,
}: {
  title: string;
  cuisine: string;
  time: string;
  score: number;
  gradientFrom: string;
  gradientTo: string;
  tags: string[];
}) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-foam shadow-warm transition-all hover:shadow-warm-lg hover:scale-[1.02]">
      {/* Image placeholder with gradient */}
      <div
        className={`relative h-56 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}
      >
        <span className="font-display text-2xl font-bold text-foam/80 text-center px-6 leading-snug">
          {title}
        </span>
        {/* Floating badges */}
        <span className="absolute top-3 left-3 rounded-full bg-amazonite/90 px-3 py-1 text-xs font-medium text-foam">
          {cuisine}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-grapefruit px-3 py-1 text-xs font-bold text-foam">
          {score}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-foam/80 px-3 py-1 text-xs font-medium text-driftwood">
          {time}
        </span>
      </div>
      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-driftwood leading-snug line-clamp-2">
          {title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-kalanchoe/25 px-3 py-1 text-xs font-medium text-amazonite"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: "📸",
    title: "Visual-First",
    description:
      "Every recipe gets a beautiful image — uploaded, AI-generated, or styled automatically.",
  },
  {
    icon: "🏷️",
    title: "Smart Filtering",
    description:
      "Filter by allergies, diet, cuisine, or mood. Combine tags to find exactly what you need.",
  },
  {
    icon: "👍",
    title: "Community Voting",
    description:
      "Upvote and downvote recipes. Track what you've tried and what you loved.",
  },
  {
    icon: "📖",
    title: "Personal Cookbook",
    description:
      "Save recipes to collections, build your tried-and-tested list, plan your week.",
  },
];

const sampleTags = [
  { label: "Gluten-Free", className: "bg-kalanchoe/25 text-amazonite" },
  { label: "Vegan", className: "bg-amazonite/15 text-amazonite" },
  { label: "Italian", className: "bg-poetry-pink/40 text-cinnamon" },
  { label: "Comfort Food", className: "bg-grapefruit/20 text-grapefruit" },
  { label: "Quick Weeknight", className: "bg-grapefruit/20 text-grapefruit" },
  { label: "Nut-Free", className: "bg-kalanchoe/25 text-amazonite" },
  { label: "Keto", className: "bg-amazonite/15 text-amazonite" },
  { label: "Japanese", className: "bg-poetry-pink/40 text-cinnamon" },
  { label: "Thai", className: "bg-poetry-pink/40 text-cinnamon" },
  { label: "Kid-Friendly", className: "bg-grapefruit/20 text-grapefruit" },
  { label: "Dairy-Free", className: "bg-kalanchoe/25 text-amazonite" },
  { label: "Mediterranean", className: "bg-poetry-pink/40 text-cinnamon" },
  { label: "One-Pot", className: "bg-grapefruit/20 text-grapefruit" },
  { label: "Budget-Friendly", className: "bg-grapefruit/20 text-grapefruit" },
];
