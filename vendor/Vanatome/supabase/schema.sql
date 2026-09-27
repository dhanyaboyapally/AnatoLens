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


-- for quiz --
create extension if not exists pgcrypto;

-- Questions reused across quiz sessions
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  organ_id text not null,
  question text not null,
  options jsonb not null,
  correct_option smallint not null,
  explanation text,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint quiz_questions_options_array
    check (jsonb_typeof(options) = 'array'),

  constraint quiz_questions_correct_option_valid
    check (
      correct_option >= 0
      and correct_option < jsonb_array_length(options)
    ),

  constraint quiz_questions_unique_question
    unique (organ_id, question)
);

-- One row per quiz attempt
create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  organ_id text not null,
  score integer not null default 0 check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Questions selected for a specific quiz session
-- Also stores the user's answer
create table if not exists public.quiz_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id),
  question_order integer not null check (question_order > 0),
  selected_option smallint,
  is_correct boolean,
  answered_at timestamptz,

  constraint quiz_session_questions_unique_question
    unique (session_id, question_id),

  constraint quiz_session_questions_unique_order
    unique (session_id, question_order)
);

create index if not exists quiz_questions_organ_idx
  on public.quiz_questions(organ_id);

create index if not exists quiz_sessions_user_idx
  on public.quiz_sessions(user_id);

create index if not exists quiz_sessions_organ_idx
  on public.quiz_sessions(organ_id);

create index if not exists quiz_session_questions_session_idx
  on public.quiz_session_questions(session_id);

-- Demo questions
-- correct_option uses zero-based indexes:
-- 0 = first option, 1 = second option, etc.

insert into public.quiz_questions
  (organ_id, question, options, correct_option, explanation)
values
(
  'heart',
  'What is the main function of the heart?',
  '["Pumping blood", "Digesting food", "Filtering urine", "Producing bile"]'::jsonb,
  0,
  'The heart pumps blood throughout the body.'
),
(
  'heart',
  'Which chamber pumps oxygenated blood into systemic circulation?',
  '["Right atrium", "Left ventricle", "Right ventricle", "Left atrium"]'::jsonb,
  1,
  'The left ventricle pumps oxygenated blood into the aorta.'
),
(
  'heart',
  'What do the coronary arteries supply?',
  '["The heart muscle", "The lungs", "The liver", "The brain"]'::jsonb,
  0,
  'Coronary arteries supply blood to the heart muscle.'
),
(
  'lungs',
  'Where does most gas exchange occur in the lungs?',
  '["Bronchi", "Alveoli", "Trachea", "Pleura"]'::jsonb,
  1,
  'Gas exchange occurs across the thin walls of the alveoli.'
),
(
  'lungs',
  'How many lobes does the right lung have?',
  '["One", "Two", "Three", "Four"]'::jsonb,
  2,
  'The right lung has superior, middle, and inferior lobes.'
),
(
  'lungs',
  'What gas enters the blood during pulmonary gas exchange?',
  '["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"]'::jsonb,
  1,
  'Oxygen diffuses from the alveoli into the blood.'
),
(
  'liver',
  'Which substance does the liver produce to help digest fats?',
  '["Insulin", "Bile", "Saliva", "Hydrochloric acid"]'::jsonb,
  1,
  'The liver produces bile, which helps digest fats.'
),
(
  'liver',
  'Which organ is the largest internal organ in the human body?',
  '["Heart", "Liver", "Lung", "Kidney"]'::jsonb,
  1,
  'The liver is the largest internal organ.'
),
(
  'liver',
  'Which major process is performed by the liver?',
  '["Detoxification", "Pumping blood", "Gas exchange", "Hearing"]'::jsonb,
  0,
  'The liver helps process nutrients and detoxify substances.'
)
on conflict (organ_id, question) do nothing;

-- MVP permissions
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on public.quiz_questions,
   public.quiz_sessions,
   public.quiz_session_questions
to anon, authenticated;

-- MVP only: disable RLS
alter table public.quiz_questions disable row level security;
alter table public.quiz_sessions disable row level security;
alter table public.quiz_session_questions disable row level security;