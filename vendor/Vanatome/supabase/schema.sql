create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  password text not null,
  dp text,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organ text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_organ_idx
on public.notes(user_id, organ);

create or replace function public.update_note_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_updated_at on public.notes;

create trigger notes_updated_at
before update on public.notes
for each row
execute function public.update_note_timestamp();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
on public.users, public.notes
to anon, authenticated;

alter table public.users disable row level security;
alter table public.notes disable row level security;