-- ============================================================
-- LEDGER — initial schema
-- One migration: profiles, admin flag, and one table per life area.
-- Every data table is scoped to auth.uid() via RLS.
-- ============================================================

-- ---------- Profiles ----------
-- One row per authenticated user. Created automatically on signup via trigger.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  theme text not null default 'light',
  lang text not null default 'en',
  currency text not null default 'EGP',
  pomo_work_min int not null default 25,
  pomo_break_min int not null default 5,
  daily_quote boolean not null default false,
  notif_due_tasks boolean not null default true,
  notif_habits boolean not null default false,
  notif_goal_deadlines boolean not null default true,
  habit_reminder_time time not null default '20:00',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user reads own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: user updates own" on public.profiles
  for update using (auth.uid() = id);

-- Admin override: is_admin users can read every profile (for the dashboard).
create policy "profiles: admin reads all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Generic helper: standard RLS for a user-owned table ----------
-- (Applied individually below per table since Postgres has no macro system.)

-- ---------- Tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  priority text check (priority in ('high','medium','low') or priority is null),
  category text,
  due date,
  due_time time,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index tasks_user_id_idx on public.tasks(user_id);
alter table public.tasks enable row level security;
create policy "tasks: owner all" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Study: subjects + sessions ----------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_hours numeric default 0
);
create index subjects_user_id_idx on public.subjects(user_id);
alter table public.subjects enable row level security;
create policy "subjects: owner all" on public.subjects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  date date not null,
  minutes int not null,
  notes text
);
create index study_sessions_user_id_idx on public.study_sessions(user_id);
create index study_sessions_subject_id_idx on public.study_sessions(subject_id);
alter table public.study_sessions enable row level security;
create policy "study_sessions: owner all" on public.study_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Gym: workouts, exercises, logs, body weight ----------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null
);
create index workouts_user_id_idx on public.workouts(user_id);
alter table public.workouts enable row level security;
create policy "workouts: owner all" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position int not null default 0
);
create index workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
alter table public.workout_exercises enable row level security;
create policy "workout_exercises: owner all" on public.workout_exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  date date not null,
  notes text
);
create index workout_logs_user_id_idx on public.workout_logs(user_id);
alter table public.workout_logs enable row level security;
create policy "workout_logs: owner all" on public.workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sets are stored as jsonb on the log entry to avoid a 4th nesting level;
-- each entry = {exercise_name, sets: [{reps, weight}]}
create table public.workout_log_entries (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.workout_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  sets jsonb not null default '[]'
);
create index workout_log_entries_log_id_idx on public.workout_log_entries(log_id);
alter table public.workout_log_entries enable row level security;
create policy "workout_log_entries: owner all" on public.workout_log_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric not null
);
create index body_weights_user_id_idx on public.body_weights(user_id);
alter table public.body_weights enable row level security;
create policy "body_weights: owner all" on public.body_weights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Habits ----------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null
);
create index habits_user_id_idx on public.habits(user_id);
alter table public.habits enable row level security;
create policy "habits: owner all" on public.habits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  unique(habit_id, date)
);
create index habit_logs_user_id_idx on public.habit_logs(user_id);
create index habit_logs_habit_id_idx on public.habit_logs(habit_id);
alter table public.habit_logs enable row level security;
create policy "habit_logs: owner all" on public.habit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Goals ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  deadline date,
  progress int not null default 0,
  notes text,
  status text not null default 'active' check (status in ('active','done'))
);
create index goals_user_id_idx on public.goals(user_id);
alter table public.goals enable row level security;
create policy "goals: owner all" on public.goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Money ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric not null,
  date date not null,
  category text,
  notes text
);
create index transactions_user_id_idx on public.transactions(user_id);
alter table public.transactions enable row level security;
create policy "transactions: owner all" on public.transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Sleep ----------
create table public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  bedtime time not null,
  wake_time time not null,
  notes text
);
create index sleep_entries_user_id_idx on public.sleep_entries(user_id);
alter table public.sleep_entries enable row level security;
create policy "sleep_entries: owner all" on public.sleep_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Notes ----------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text,
  pinned boolean not null default false,
  updated_at timestamptz not null default now()
);
create index notes_user_id_idx on public.notes(user_id);
alter table public.notes enable row level security;
create policy "notes: owner all" on public.notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Admin dashboard read access
-- Admins can read (not write) every user-owned table, scoped by the
-- same is_admin flag on profiles. Applied only where a dashboard
-- would plausibly need aggregate visibility: profiles is enough for
-- "who signed up, with what email, when" — the rest stays private.
-- ============================================================
