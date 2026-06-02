-- Fix infinite recursion in RLS policies
-- Problem: group_members policy queries group_members itself → infinite loop
-- Solution: use security definer function that bypasses RLS

-- ─── Helper function (runs as postgres, bypasses RLS) ─────────────────────
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- ─── Drop old recursive policies ──────────────────────────────────────────
drop policy if exists "Members can view group members"  on public.group_members;
drop policy if exists "Group members can view group"    on public.groups;
drop policy if exists "Group members can view events"   on public.events;
drop policy if exists "Group members can view participants" on public.event_participants;
drop policy if exists "Group members can view expenses" on public.expense_items;
drop policy if exists "Group members can view payment QR" on public.payment_qr;

-- ─── Re-create policies using the helper function ─────────────────────────

-- group_members: user sees memberships in groups they belong to
create policy "Members can view group members"
  on public.group_members for select
  using ( public.is_group_member(group_id) );

-- groups
create policy "Group members can view group"
  on public.groups for select
  using ( public.is_group_member(id) );

-- events
create policy "Group members can view events"
  on public.events for select
  using ( public.is_group_member(group_id) );

-- event_participants
create policy "Group members can view participants"
  on public.event_participants for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
        and public.is_group_member(e.group_id)
    )
  );

-- expense_items
create policy "Group members can view expenses"
  on public.expense_items for select
  using (
    exists (
      select 1 from public.events e
      where e.id = expense_items.event_id
        and public.is_group_member(e.group_id)
    )
  );

-- payment_qr
create policy "Group members can view payment QR"
  on public.payment_qr for select
  using (
    exists (
      select 1 from public.events e
      where e.id = payment_qr.event_id
        and public.is_group_member(e.group_id)
    )
  );
