-- Create profiles table (unified for patients and doctors)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  role text not null check (role in ('patient', 'doctor')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger function
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'patient') -- default to patient if not specified
  );
  return new;
end;
$$;

-- Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

