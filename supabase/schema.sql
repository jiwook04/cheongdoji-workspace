-- 청도지 WORKSPACE 초기 데이터베이스 스키마
-- Supabase SQL Editor에서 전체 실행하세요.
create extension if not exists pgcrypto;

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  cohort text,
  manager text,
  status text not null default '참여중',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '프로그램',
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  attend_date date not null,
  status text not null default '출석',
  memo text,
  created_at timestamptz not null default now()
);
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  consulted_at date not null default current_date,
  manager text,
  category text,
  content text,
  next_action text,
  created_at timestamptz not null default now()
);
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  activity_date date not null default current_date,
  activity_name text not null,
  status text not null default '참여',
  memo text,
  created_at timestamptz not null default now()
);

-- 팀원 가입 시 본인 계정을 팀 멤버로 등록합니다. 기본 권한은 member입니다.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.team_members(user_id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), 'member')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_team_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.team_members where user_id = auth.uid());
$$;

alter table public.team_members enable row level security;
alter table public.participants enable row level security;
alter table public.schedules enable row level security;
alter table public.attendance enable row level security;
alter table public.consultations enable row level security;
alter table public.followups enable row level security;

drop policy if exists "team members can read team" on public.team_members;
create policy "team members can read team" on public.team_members for select to authenticated using (public.is_team_member());
drop policy if exists "members can read own membership" on public.team_members;
create policy "members can read own membership" on public.team_members for select to authenticated using (user_id = auth.uid());

do $$ declare t text; begin
 foreach t in array array['participants','schedules','attendance','consultations','followups'] loop
  execute format('drop policy if exists "team access %1$s" on public.%1$I',t);
  execute format('create policy "team access %1$s" on public.%1$I for all to authenticated using (public.is_team_member()) with check (public.is_team_member())',t);
 end loop;
end $$;

-- 기본값으로 가입한 팀원은 자동으로 멤버가 됩니다.
-- 첫 관리자 지정: 아래 UUID를 실제 관리자 auth.users.id로 바꾸어 실행하세요.
-- update public.team_members set role='admin' where user_id='관리자-UUID';
