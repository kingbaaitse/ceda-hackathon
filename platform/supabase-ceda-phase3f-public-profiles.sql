-- CEDA Innovation Hub - Phase 3F: public profiles behind the awards gallery
--
-- Visitors of the public gallery can open the profile of a participant whose
-- entry was awarded. Only presentation fields are exposed: no email, phone or
-- other contact data ever leaves the portal. The view runs as its owner
-- (security definer), so it deliberately bypasses the row-level security on
-- ceda_profiles and exposes only these columns.

create or replace view public.ceda_award_profiles as
select p.id, p.full_name, p.title, p.avatar_path, p.org_name, p.bio, p.location
from public.ceda_profiles p
where exists (
  select 1 from public.ceda_submissions s
  where s.stage = 'awarded'
    and (
      s.owner_id = p.id
      or p.full_name in (
        select m->>'name' from jsonb_array_elements(coalesce(s.team_members, '[]'::jsonb)) m
      )
    )
);

grant select on public.ceda_award_profiles to anon, authenticated;
