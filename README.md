# Personal Progress Tracker PWA

Mobile-first Next.js PWA for two friends to track weight, meals, and workouts with local-first storage and Supabase sync.

## What is included

- Next.js App Router + TypeScript scaffold
- Minimal mobile UI for `Today`, `Weight`, `Diet`, `Workout`, and `Profile`
- IndexedDB local-first persistence with a small sync queue
- Lightweight email-based local sign-in with no confirmation step
- Direct friend-email sharing for one-to-one visibility
- Service worker, manifest, and offline fallback page
- Supabase SQL migration for open email-keyed sync tables

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase values.

3. Run the app:

```bash
npm run dev
```

4. Apply the SQL in `supabase/migrations/001_initial.sql` inside your Supabase project SQL editor or migration flow.

## Notes

- Offline logging writes to IndexedDB immediately and syncs when the app comes back online.
- Friend data is read-only and based on last synced state while offline.
- Users enter an email locally and continue immediately without inbox confirmation.
- If you already created the old auth-based Supabase tables, replace them with the new email-keyed schema before syncing.
- If Supabase returns `Could not find the table 'public.profiles' in the schema cache`, the SQL schema has not been applied to that Supabase project yet. Run `supabase/migrations/001_initial.sql`, wait a few seconds for PostgREST to reload, then refresh the app.
