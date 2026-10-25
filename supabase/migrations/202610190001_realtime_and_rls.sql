-- FIRE54: production-safe cross-device sync
-- Apply through the Supabase SQL editor or the Supabase CLI before release.

begin;

alter table public.profiles enable row level security;
alter table public.user_sync_data enable row level security;

drop policy if exists "Users can view and manage their own profile" on public.profiles;
create policy "Users can view and manage their own profile"
on public.profiles for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view and manage their own sync data" on public.user_sync_data;
create policy "Users can view and manage their own sync data"
on public.user_sync_data for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_sync_data_updated_at on public.user_sync_data;
create trigger set_user_sync_data_updated_at
before update on public.user_sync_data
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_sync_data'
  ) then
    execute 'alter publication supabase_realtime add table public.user_sync_data';
  end if;
end;
$$;

commit;
