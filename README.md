# Fresco Forum

Student forum for art and politics — Next.js 14 (App Router) + Tailwind + Supabase.

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the SQL files in order**, in the Supabase SQL editor:
   - `supabase/schema.sql`
   - `supabase/functions.sql`
   - `supabase/policies.sql`
   - `supabase/storage.sql`
   - `supabase/profile-media-policies.sql` (when updating an existing project)
   - `supabase/profile-media-position.sql` (when updating an existing project)
3. **Enable Google auth**: Supabase dashboard → Authentication → Providers → Google. Add your OAuth client ID/secret, and set the redirect URL to `https://<your-app-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).
4. **Copy env vars**: `cp .env.local.example .env.local` and fill in your project URL, anon key, and service role key.
5. `npm install`
6. `npm run dev`

## Deploying to Vercel

In the Vercel project, open **Settings -> Environment Variables** and add these variables for the **Production** environment (and Preview if you use preview deployments):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the values from Supabase **Project Settings -> API**. `.env.local` is ignored by git and is not available to Vercel. After saving the variables, create a new deployment so Next.js rebuilds with them. The service role key must remain server-only and must not be prefixed with `NEXT_PUBLIC_`.

To make yourself a moderator for testing, run in the SQL editor:

```sql
update profiles set account_type = 'moderator' where username = 'your_username';
```

## What's wired up vs. what's a stub

**Real, end-to-end:**

- Signup/login (email+password and Google), with automatic school verification by email domain (`school_domains` table)
- Feed with sort (new/popular/most discussed) and category filtering, reading real Supabase rows
- Voting (upvote/downvote/un-vote), server-side, with score kept in sync by a DB trigger
- Create post, with political categories automatically routed to `pending_review` by a DB trigger — **not** trusted from the client
- File upload to Supabase Storage with client + server size/type checks
- Reporting a post
- Profile pages by username
- Explore page (art grid + basic ilike search)
- Moderator dashboard: approve/remove pending posts, view open reports — every action requires a reason and is logged to `mod_actions`

**Stubbed / next steps:**

- Comment threads (schema and RLS exist; no UI yet)
- Image dimension check is client-side only for now — note in `lib/actions/posts.js` on where a server-side probe would go
- Ban/suspend enforcement on login (currently just sets `is_banned`; you'd add a check in `middleware.js` or a login-time gate)
- Organization/sponsor account flow (schema exists — `organization_details` — no signup UI)
- Full-text search (current search is `ilike`; fine for an MVP, swap for a `tsvector` column + GIN index before it gets slow)
- Reputation is currently just `vote_score` on the user's own posts/comments summed manually — decide on a real formula and whether it's a live trigger or a scheduled job before this matters
