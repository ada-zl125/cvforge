create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Resume',
  template text not null default 'general',
  content jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table resumes enable row level security;

create policy "Users can CRUD own resumes" on resumes for all using (auth.uid() = user_id);
