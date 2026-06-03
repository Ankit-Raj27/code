create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id text primary key,
  display_name text not null,
  daily_calorie_target integer,
  daily_protein_target integer,
  weight_goal_kg numeric(5,2),
  buddy_id text,
  share_targets boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  value_kg numeric(5,2) not null check (value_kg > 0),
  logged_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  meal_name text not null,
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Pre-workout', 'Dinner', 'Snack', 'Custom')),
  note text,
  logged_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  workout_name text not null,
  note text,
  logged_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists idx_profiles_buddy_id on public.profiles(buddy_id);
create index if not exists idx_weight_entries_user_id on public.weight_entries(user_id);
create index if not exists idx_meal_entries_user_id on public.meal_entries(user_id);
create index if not exists idx_workout_entries_user_id on public.workout_entries(user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.weight_entries to anon, authenticated;
grant select, insert, update, delete on public.meal_entries to anon, authenticated;
grant select, insert, update, delete on public.workout_entries to anon, authenticated;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists weight_entries_touch_updated_at on public.weight_entries;
create trigger weight_entries_touch_updated_at
before update on public.weight_entries
for each row execute function public.touch_updated_at();

drop trigger if exists meal_entries_touch_updated_at on public.meal_entries;
create trigger meal_entries_touch_updated_at
before update on public.meal_entries
for each row execute function public.touch_updated_at();

drop trigger if exists workout_entries_touch_updated_at on public.workout_entries;
create trigger workout_entries_touch_updated_at
before update on public.workout_entries
for each row execute function public.touch_updated_at();

notify pgrst, 'reload schema';
