-- GAZIOAI persistence schema
-- Run this once in Supabase SQL Editor.
-- Dedicated table names are used so your existing `messages` table is not modified.

create table if not exists public.gazioai_threads (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  status text not null default 'regular' check (status in ('regular', 'archived')),
  custom jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gazioai_threads_user_updated_idx
  on public.gazioai_threads(user_id, updated_at desc);

create table if not exists public.gazioai_messages (
  id text primary key,
  thread_id text not null references public.gazioai_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id text,
  format text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists gazioai_messages_thread_created_idx
  on public.gazioai_messages(thread_id, created_at asc);

create index if not exists gazioai_messages_user_idx
  on public.gazioai_messages(user_id);

alter table public.gazioai_threads enable row level security;
alter table public.gazioai_messages enable row level security;

drop policy if exists "Users can view their own GAZIOAI threads" on public.gazioai_threads;
drop policy if exists "Users can create their own GAZIOAI threads" on public.gazioai_threads;
drop policy if exists "Users can update their own GAZIOAI threads" on public.gazioai_threads;
drop policy if exists "Users can delete their own GAZIOAI threads" on public.gazioai_threads;

create policy "Users can view their own GAZIOAI threads"
on public.gazioai_threads for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own GAZIOAI threads"
on public.gazioai_threads for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own GAZIOAI threads"
on public.gazioai_threads for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own GAZIOAI threads"
on public.gazioai_threads for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own GAZIOAI messages" on public.gazioai_messages;
drop policy if exists "Users can create their own GAZIOAI messages" on public.gazioai_messages;
drop policy if exists "Users can update their own GAZIOAI messages" on public.gazioai_messages;
drop policy if exists "Users can delete their own GAZIOAI messages" on public.gazioai_messages;

create policy "Users can view their own GAZIOAI messages"
on public.gazioai_messages for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own GAZIOAI messages"
on public.gazioai_messages for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own GAZIOAI messages"
on public.gazioai_messages for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own GAZIOAI messages"
on public.gazioai_messages for delete
to authenticated
using ((select auth.uid()) = user_id);
