create extension if not exists pgcrypto;

create table if not exists public.stories (
  book_id text primary key,
  title text not null,
  image text,
  content text not null,
  images jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by_name text
);

alter table public.stories enable row level security;

drop policy if exists "stories_select_all" on public.stories;
create policy "stories_select_all"
on public.stories
for select
to public
using (true);

drop policy if exists "stories_insert_public" on public.stories;
create policy "stories_insert_public"
on public.stories
for insert
to public
with check (true);

drop policy if exists "stories_update_public" on public.stories;
create policy "stories_update_public"
on public.stories
for update
to public
using (true)
with check (true);

create table if not exists public.library_users (
  username text primary key,
  display_name text not null,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

revoke all on public.library_users from anon, authenticated;

create or replace function public.register_user(
  p_username text,
  p_display_name text,
  p_password_hash text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.library_users where username = p_username) then
    return json_build_object(
      'success', false,
      'message', 'Username already exists'
    );
  end if;

  insert into public.library_users (username, display_name, password_hash)
  values (p_username, p_display_name, p_password_hash);

  return json_build_object(
    'success', true,
    'username', p_username,
    'display_name', p_display_name
  );
end;
$$;

create or replace function public.authenticate_user(
  p_username text,
  p_password_hash text
)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select json_build_object(
        'success', true,
        'username', username,
        'display_name', display_name
      )
      from public.library_users
      where username = p_username
        and password_hash = p_password_hash
      limit 1
    ),
    json_build_object(
      'success', false,
      'message', 'Invalid username or password'
    )
  );
$$;

grant execute on function public.register_user(text, text, text) to anon, authenticated;
grant execute on function public.authenticate_user(text, text) to anon, authenticated;
