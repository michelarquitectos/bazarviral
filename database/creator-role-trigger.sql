-- Ejecutar una sola vez en Supabase SQL Editor.
-- Otorga automáticamente el rol creador cuando una cuenta solicita su perfil.
create or replace function public.assign_creator_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.account_roles (account_id, role)
  values (new.account_id, 'creator')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_creator_profile_created on public.creator_profiles;
create trigger on_creator_profile_created
after insert on public.creator_profiles
for each row execute function public.assign_creator_role();
