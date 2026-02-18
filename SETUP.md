# Sitepins Updates — Setup Guide

## Live URL
🌐 **https://sitepins-updates.pages.dev**

## What's Working Right Now
- ✅ Feedback Kanban board UI (all 4 columns)
- ✅ "Add Feedback" modal with form
- ✅ Changelog page (reads from `changelog/*.json` files)
- ✅ Launch changelog entry visible
- ✅ RESEND_API_KEY configured in Cloudflare Pages

## What Needs Manual Setup: D1 Database

The API token used during build didn't have D1 permissions. You need to create the database manually.

### Step 1 — Create D1 Database

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **D1**
2. Click **Create database**
3. Name it: `sitepins-updates-db`
4. Copy the **database ID** (UUID format)

### Step 2 — Update wrangler.toml

Open `wrangler.toml` and update the D1 section:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sitepins-updates-db"
database_id = "YOUR_ACTUAL_UUID_HERE"
```

(Uncomment the block and replace the placeholder)

### Step 3 — Run Migration

```bash
npx wrangler d1 execute sitepins-updates-db --file=migrations/0001_init.sql --remote
```

This creates the `feedback` table and seeds 5 example items.

### Step 4 — Add D1 Binding in Pages Dashboard

1. Go to **Cloudflare Pages** → **sitepins-updates** → **Settings** → **Functions**
2. Under **D1 database bindings**, click **Add binding**
3. Variable name: `DB`
4. Database: `sitepins-updates-db`

### Step 5 — Redeploy

```bash
npm run pages:build
CLOUDFLARE_API_TOKEN=your_token npx wrangler pages deploy .vercel/output/static --project-name=sitepins-updates --branch=main
```

Or push a commit to trigger any CI you set up.

---

## Adding Changelog Entries

Add JSON files to `changelog/` directory:

```json
{
  "date": "2026-03-01",
  "title": "New feature shipped",
  "tags": ["Feature", "Editor"],
  "details": "Markdown content here...",
  "image": "https://example.com/screenshot.png"
}
```

Files are sorted by filename (newest first). The `image` field is optional.

## GitHub Auto-Deploy Setup

To enable auto-deploy on push:
1. Go to **Cloudflare Pages** → **sitepins-updates** → **Settings** → **Builds & deployments**
2. Connect to GitHub repo `incognitovaultentry/sitepins-updates`
3. Build command: `npm run pages:build`
4. Build output directory: `.vercel/output/static`

OR use GitHub Actions with `wrangler pages deploy` (example in `.github/workflows/` — create as needed).

## Stack Summary
- Next.js 15 (App Router, edge runtime for API routes)
- @cloudflare/next-on-pages adapter
- Cloudflare Pages (deployed)
- Cloudflare D1 (needs manual setup per above)
- Tailwind CSS (dark/light compatible)
- Resend (for email notifications to hi@sitepins.com)
