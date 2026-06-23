# Health Tracker

A nutrition + fitness tracker. Logs food, water, weight; computes BMI / BMR / TDEE / macros; AI coach answers questions about your day.

Built with **Next.js 16**, **TypeScript**, **Tailwind v4**, **Supabase** (Postgres), **Groq** (Llama 3.3 70B for the coach), and the **USDA FoodData Central API** for the 380K+ food database.

## Features

- **Dashboard** — animated calorie ring, macro cards, water tracker with quick-add, weight trend chart
- **Meals** — Breakfast / Lunch / Dinner / Snacks grouping with per-meal totals
- **Food Search** — 116 curated Indian + Western foods, plus USDA fallback for anything else
- **Analytics** — 7/30/90-day Recharts trends for calories, protein, weight, water
- **BMI & Calorie Calculator** — visual BMI meter, BMR + TDEE + 3 goal targets
- **AI Coach** — chat with Llama 3.3 70B (via Groq) that sees your live profile + today's log
- **Profile** — full body stats, activity, goal, water target, dark/light theme

## Math used

- **BMI** = weight (kg) / [height (m)]² — Asian-Indian or General WHO thresholds
- **BMR** = Mifflin-St Jeor (10·kg + 6.25·cm − 5·age + {5 male / −161 female})
- **TDEE** = BMR × activity multiplier (1.2 → 1.9)
- **Macros** (bodyweight-based, not % of calories):
  - Protein g/kg by goal — cut 2.0 · maintain 1.6 · bulk 1.8
  - Fat g/kg by goal — cut 0.8 · maintain 0.9 · bulk 1.0
  - Carbs = remaining calories ÷ 4
- **Fiber** = 14 g per 1000 kcal (NIH / USDA)

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Theme | next-themes (dark default) |
| Data fetching | SWR |
| Database | Supabase Postgres |
| AI | Groq Llama 3.3 70B Versatile |
| Food data | USDA FoodData Central |
| Hosting | Vercel |

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Adityasiig/health-tracker.git
cd health-tracker
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run `supabase/migrations/0001_initial_schema.sql` (schema).
3. SQL Editor → run `supabase/migrations/0002_seed_foods.sql` (116 foods).
4. Settings → API → copy **Project URL** and **service_role key**.

### 3. Get other API keys

- **Groq**: [console.groq.com](https://console.groq.com) → API Keys → Create
- **USDA**: [fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html) → instant

### 4. Configure env

```bash
cp .env.example .env.local
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, USDA_API_KEY
```

### 5. Run

```bash
npm run dev    # localhost:3000
# or
npm run build && npm run start    # production
```

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the 4 env vars (same as `.env.local`) in the Environment Variables section.
4. Click Deploy.

Auto-redeploys on every push to `main`.

## License

MIT
