create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  password text not null,
  dp text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organ_id text not null,
  note text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists notes_user_organ_idx
  on public.notes (user_id, organ_id);

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists notes_updated_at on public.notes;

create trigger notes_updated_at
before update on public.notes
for each row
execute function public.set_notes_updated_at();
