# Pronunciation Battle

A production-oriented React + Vite experience for hosted pronunciation competitions.

## Launch locally

1. Copy `.env.example` to `.env` and add the Supabase project URL and anon key.
2. Run the complete [Supabase schema](./supabase/schema.sql) in the Supabase SQL Editor.
3. In Supabase Auth, create a host user, then promote them with the `update public.profiles ...` command noted in the schema. The included trigger creates the matching participant profile automatically.
4. Install packages and run `npm run dev`.

## Production security model

The browser only receives Supabase's anon key. Every important action is enforced through Row Level Security: only profiles with `role = 'host'` can create or manage their own competitions; public visitors can only find open rooms and insert their own join entry. The host dashboard is also guarded client-side for a polished navigation experience.

## Deploy to GitHub Pages

Enable **Pages → GitHub Actions**, then add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository Actions secrets. The workflow assumes the GitHub project repository is named `pronunciation-battle`; change `VITE_BASE_PATH` if it differs. Configure your Supabase Auth URL settings to include the final GitHub Pages URL.
