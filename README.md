# NexusChatHub

NexusChatHub is a premium-styled realtime chat workspace built with Next.js, Tailwind CSS v4, Framer Motion, and Supabase Auth + Realtime.

## What It Includes

- Realtime channels and messages
- Presence and typing indicators
- Reactions, editing, and moderation-ready message UI
- Supabase email/password auth
- Static export for GitHub Pages
- Mobile-friendly chat layout

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS v4
- Supabase JavaScript client
- Framer Motion
- Lucide icons

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Start development:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Environment Variables

The app supports Supabase's current publishable key naming, and still falls back to the older anon-key name for compatibility.

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred frontend key.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is only kept as a fallback for older setups.
- The Postgres connection string is not used by the frontend app.

## Supabase CLI

Useful commands for working with your linked project:

```bash
supabase login
supabase init
supabase link --project-ref your-project-ref
```

## Build

Run a production build locally with:

```bash
npm run build
```

## GitHub Pages Deployment

This repo is configured to deploy the exported Next.js site from GitHub Actions.

In GitHub repository settings:

1. Go to `Settings -> Pages`
2. Set `Source` to `GitHub Actions`

In GitHub repository secrets, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` if you use Turnstile in production

The workflow builds the app, prepares `out/.nojekyll`, and publishes the static export.

## Project Structure

```text
src/app/               App routes
src/components/chat/   Chat interface components
src/components/modals/ Modal UI
src/hooks/             Reusable client hooks
src/lib/               Supabase client and shared utilities
.github/workflows/     GitHub Pages deployment
```

## Troubleshooting

### Tailwind native binding error

If you hit an error about `@tailwindcss/oxide-linux-x64-gnu`, reinstall dependencies:

```bash
rm -rf node_modules package-lock.json .next
npm install
```

Then restart dev:

```bash
npm run dev
```

### GitHub Pages shows the README instead of the app

That usually means Pages is using `Deploy from branch` instead of `GitHub Actions`.

Switch it to:

```text
Settings -> Pages -> Source -> GitHub Actions
```
