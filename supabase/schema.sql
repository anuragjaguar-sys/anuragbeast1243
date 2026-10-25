create table if not exists public.profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view and manage their own profile"
on public.profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_sync_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  store_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, store_key)
);

alter table public.user_sync_data enable row level security;

create policy "Users can view and manage their own sync data"
on public.user_sync_data for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Keep conflict detection accurate for every update, not only inserts.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_user_sync_data_updated_at
before update on public.user_sync_data
for each row execute function public.set_updated_at();

-- Supabase Realtime only broadcasts tables that belong to this publication.
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.user_sync_data;
