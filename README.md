# GAZIOAI

A dark cyber-style AI chat UI built with Next.js, assistant-ui, OpenRouter and Supabase.

## Features

- OpenRouter free model routing via `openrouter/free`
- Supabase email/password authentication
- Persistent threads and message history
- Per-user Row Level Security
- Thread rename, archive and delete
- Chat history survives reloads and returning to the account
- Vercel-friendly Next.js setup

## 1. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```env
OPENROUTER_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 2. Configure Supabase

Open the Supabase SQL Editor and run:

```text
supabase/schema.sql
```

The migration creates dedicated `gazioai_threads` and `gazioai_messages` tables and does not modify an existing `messages` table.

Email/password authentication must be enabled in Supabase Authentication.

For the easiest first test, you can turn off email confirmation in the Supabase Auth settings. If email confirmation stays enabled, GAZIOAI will tell a new user to confirm their email before signing in.

## 3. Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## 4. Deploy to Vercel

Add the same three environment variables to the Vercel project settings. Do not commit `.env.local` or any private OpenRouter key to GitHub.
