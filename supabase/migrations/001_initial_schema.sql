-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════
-- STEP 1: CREATE ALL TABLES (no cross-ref policies yet)
-- ═══════════════════════════════════════════

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone        text unique,
  email        text unique,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  sport        text not null default 'badminton',
  cover_url    text,
  invite_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('organizer', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.events (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups(id) on delete cascade,
  title          text not null,
  location       text,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  max_players    int not null check (max_players > 0),
  num_courts     int not null default 1 check (num_courts > 0),
  status         text not null default 'open' check (status in ('open', 'closed', 'done')),
  estimated_cost numeric(10,2),
  created_by     uuid not null references public.users(id),
  created_at     timestamptz not null default now()
);

create table public.event_participants (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references public.events(id) on delete cascade,
  user_id   uuid not null references public.users(id) on delete cascade,
  status    text not null default 'confirmed' check (status in ('confirmed', 'waitlist', 'left')),
  position  int,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.expense_items (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  label      text not null,
  amount     numeric(10,2) not null check (amount >= 0),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.expense_splits (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  user_id          uuid not null references public.users(id) on delete cascade,
  amount_due       numeric(10,2) not null,
  payment_status   text not null default 'unpaid'
                     check (payment_status in ('unpaid', 'pending_review', 'paid', 'rejected')),
  slip_url         text,
  slip_uploaded_at timestamptz,
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.users(id),
  unique (event_id, user_id)
);

create table public.payment_qr (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null unique references public.events(id) on delete cascade,
  qr_url      text not null,
  bank_info   text,
  uploaded_by uuid not null references public.users(id),
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ═══════════════════════════════════════════

alter table public.users            enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.events           enable row level security;
alter table public.event_participants enable row level security;
alter table public.expense_items    enable row level security;
alter table public.expense_splits   enable row level security;
alter table public.payment_qr       enable row level security;


-- ═══════════════════════════════════════════
-- STEP 3: RLS POLICIES (all tables exist now)
-- ═══════════════════════════════════════════

-- users
create policy "Users can view all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- groups
create policy "Group members can view group"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create group"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Organizer can update group"
  on public.groups for update
  using (created_by = auth.uid());

-- group_members
create policy "Members can view group members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "Users can join group"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Organizer can manage members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'organizer'
    )
  );

-- events
create policy "Group members can view events"
  on public.events for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = events.group_id and user_id = auth.uid()
    )
  );

create policy "Organizer can create events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.group_members
      where group_id = events.group_id
        and user_id = auth.uid()
        and role = 'organizer'
    )
  );

create policy "Organizer can update events"
  on public.events for update
  using (created_by = auth.uid());

-- event_participants
create policy "Group members can view participants"
  on public.event_participants for select
  using (
    exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = event_participants.event_id and gm.user_id = auth.uid()
    )
  );

create policy "Members can join events"
  on public.event_participants for insert
  with check (auth.uid() = user_id);

create policy "Members can update own participation"
  on public.event_participants for update
  using (auth.uid() = user_id);

-- expense_items
create policy "Group members can view expenses"
  on public.expense_items for select
  using (
    exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = expense_items.event_id and gm.user_id = auth.uid()
    )
  );

create policy "Organizer can insert expense items"
  on public.expense_items for insert
  with check (auth.uid() = created_by);

create policy "Organizer can update expense items"
  on public.expense_items for update
  using (created_by = auth.uid());

create policy "Organizer can delete expense items"
  on public.expense_items for delete
  using (created_by = auth.uid());

-- expense_splits
create policy "Participants can view their split"
  on public.expense_splits for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.events e
      where e.id = expense_splits.event_id and e.created_by = auth.uid()
    )
  );

create policy "Participants can upload slip"
  on public.expense_splits for update
  using (auth.uid() = user_id);

create policy "Organizer can review splits"
  on public.expense_splits for update
  using (
    exists (
      select 1 from public.events e
      where e.id = expense_splits.event_id and e.created_by = auth.uid()
    )
  );

-- payment_qr
create policy "Group members can view payment QR"
  on public.payment_qr for select
  using (
    exists (
      select 1 from public.events e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = payment_qr.event_id and gm.user_id = auth.uid()
    )
  );

create policy "Organizer can upload QR"
  on public.payment_qr for insert
  with check (auth.uid() = uploaded_by);

create policy "Organizer can update QR"
  on public.payment_qr for update
  using (auth.uid() = uploaded_by);


-- ═══════════════════════════════════════════
-- STEP 4: FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'User'),
    new.email,
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Waitlist auto-promotion
create or replace function public.promote_waitlist()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_max_players int;
  v_confirmed   int;
  v_next        uuid;
begin
  if new.status <> 'left' then return new; end if;

  select max_players into v_max_players from public.events where id = new.event_id;
  select count(*) into v_confirmed
    from public.event_participants
    where event_id = new.event_id and status = 'confirmed';

  if v_confirmed < v_max_players then
    select id into v_next
      from public.event_participants
      where event_id = new.event_id and status = 'waitlist'
      order by position asc
      limit 1;

    if v_next is not null then
      update public.event_participants
        set status = 'confirmed', position = null
        where id = v_next;

      update public.event_participants
        set position = sub.new_pos
        from (
          select id, row_number() over (order by position) as new_pos
          from public.event_participants
          where event_id = new.event_id and status = 'waitlist'
        ) sub
        where event_participants.id = sub.id;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_participant_left
  after update of status on public.event_participants
  for each row execute procedure public.promote_waitlist();

-- Close event & snapshot expense splits
create or replace function public.close_event_expenses(p_event_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_total        numeric(10,2);
  v_player_count int;
  v_per_person   numeric(10,2);
begin
  if not exists (
    select 1 from public.events where id = p_event_id and created_by = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  select coalesce(sum(amount), 0) into v_total
    from public.expense_items where event_id = p_event_id;

  select count(*) into v_player_count
    from public.event_participants
    where event_id = p_event_id and status = 'confirmed';

  if v_player_count = 0 then
    raise exception 'No confirmed players';
  end if;

  v_per_person := round(v_total / v_player_count, 2);

  insert into public.expense_splits (event_id, user_id, amount_due)
    select p_event_id, user_id, v_per_person
    from public.event_participants
    where event_id = p_event_id and status = 'confirmed'
  on conflict (event_id, user_id) do update
    set amount_due = excluded.amount_due;

  update public.events set status = 'done' where id = p_event_id;
end;
$$;
