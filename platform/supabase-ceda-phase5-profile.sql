-- CEDA Innovation Hub - Phase 5: profiles
-- Profile fields (title, bio, phone, location, team name, avatar), a public
-- bucket for avatars, and the policies that let a user manage their own.
-- Safe to re-run.

-- ============================================================
-- 1) Profile fields
-- ============================================================
alter table public.ceda_profiles
  add column if not exists title text;
alter table public.ceda_profiles
  add column if not exists bio text;
alter table public.ceda_profiles
  add column if not exists phone text;
alter table public.ceda_profiles
  add column if not exists location text;
alter table public.ceda_profiles
  add column if not exists team_name text;
alter table public.ceda_profiles
  add column if not exists avatar_path text;

-- ============================================================
-- 2) Avatars: public bucket (so avatars render on marketing pages too)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ceda-avatars', 'ceda-avatars', true)
on conflict (id) do nothing;

drop policy if exists "ceda avatar read" on storage.objects;
create policy "ceda avatar read" on storage.objects
  for select to public
  using (bucket_id = 'ceda-avatars');

drop policy if exists "ceda avatar insert" on storage.objects;
create policy "ceda avatar insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ceda-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ceda avatar update" on storage.objects;
create policy "ceda avatar update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'ceda-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'ceda-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ceda avatar delete" on storage.objects;
create policy "ceda avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'ceda-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 3) A user may edit their own profile; everyone may read it
-- ============================================================
drop policy if exists ceda_profiles_update on public.ceda_profiles;
create policy ceda_profiles_update on public.ceda_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Public read of the profile (name, avatar, bio) for the team directory
drop policy if exists ceda_profiles_read on public.ceda_profiles;
create policy ceda_profiles_read on public.ceda_profiles
  for select to authenticated, anon
  using (true);
