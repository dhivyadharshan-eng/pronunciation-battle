-- Run this once in Supabase SQL Editor. It creates roles, competition data, RLS,
-- and realtime participant events. Never put a service-role key in the frontend.
create type public.app_role as enum ('host', 'participant');
create type public.competition_status as enum ('draft', 'live', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'participant',
  display_name text,
  created_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(title) between 3 and 100),
  description text,
  status public.competition_status not null default 'draft',
  starts_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  score integer not null default 0 check (score >= 0),
  joined_at timestamptz not null default now()
);

-- Every Auth signup receives a matching, least-privileged application profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index participants_competition_id_idx on public.participants(competition_id);
alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.participants enable row level security;

-- A host's role is assigned by an administrator in SQL after signup:
-- update public.profiles set role = 'host' where id = 'USER_UUID';
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "hosts create competitions" on public.competitions for insert to authenticated with check (host_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'host'));
create policy "hosts manage own competitions" on public.competitions for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "guests find open competitions" on public.competitions for select to anon, authenticated using (status in ('draft', 'live'));
create policy "guests join open competitions" on public.participants for insert to anon, authenticated with check (exists (select 1 from public.competitions c where c.id = competition_id and c.status in ('draft', 'live')));
create policy "room participants are readable" on public.participants for select to anon, authenticated using (exists (select 1 from public.competitions c where c.id = competition_id and c.status in ('draft', 'live')));
create policy "hosts manage room participants" on public.participants for all to authenticated using (exists (select 1 from public.competitions c where c.id = competition_id and c.host_id = auth.uid())) with check (exists (select 1 from public.competitions c where c.id = competition_id and c.host_id = auth.uid()));

alter publication supabase_realtime add table public.participants;
