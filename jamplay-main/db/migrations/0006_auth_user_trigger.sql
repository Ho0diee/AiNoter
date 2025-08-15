-- Auto-create a row in public.users when someone signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, username, role)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'user_' || left(new.id::text, 6)),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
