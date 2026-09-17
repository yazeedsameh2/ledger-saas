# Ledger

A calm, personal life-management app — Tasks, Study, Gym, Habits, Goals, Money, Sleep, and Notes — built as a real multi-user SaaS.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** — Postgres database, auth, and row-level security
- **Vercel** — hosting

## Setup after importing to Vercel

1. **Import this repo into Vercel.** Vercel auto-detects Next.js — no build settings to change.
2. **Environment variables** (Project Settings → Environment Variables). The app already has working fallback values baked in for the current Supabase project, so it will run without these — but for your own long-term setup, add:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` / `publishable` key from the same page
3. **Deploy.** First deploy takes ~1-2 minutes.

## Database

The schema (tables + row-level security policies) already lives in the connected Supabase project — nothing to run manually. `supabase/migration.sql` in this repo is a reference copy of what was applied, kept for history; you don't need to re-run it.

## Admin dashboard

The **first person to ever sign up** is automatically marked as an admin and gets an "Admin" link in the sidebar, showing every signup (email, name, signup date, last seen). No one else can see this page or this data — it's enforced at the database level via row-level security, not just hidden in the UI.

## Local development

This project was built and deployed without a local Node environment — every file was written directly and validated by deploying to Vercel. If you do have Node locally:

```bash
npm install
npm run dev
```

## Project structure

```
app/
  (app)/           # every page behind login — shares one sidebar layout
    home/ tasks/ study/ gym/ habits/ goals/ money/ sleep/ notes/ statistics/ settings/ admin/
  actions/         # server actions — all database writes go through these
  login/ signup/   # auth pages
lib/
  supabase/        # browser + server Supabase clients
  types.ts         # TypeScript types matching the database schema
components/        # shared UI: buttons, inputs, modal, toast, sidebar
middleware.ts      # protects every page behind login, redirects appropriately
```
