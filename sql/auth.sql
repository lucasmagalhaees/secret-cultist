-- D138: run once in the Supabase SQL Editor of the lore-enhancer project (idempotent).
-- The expansion's key, readable only by a logged-in user whose app_metadata.role is 'driver'.
create table if not exists game_secrets (
  name text primary key,
  value text not null
);
alter table game_secrets enable row level security;
drop policy if exists "drivers read the game secrets" on game_secrets;
create policy "drivers read the game secrets" on game_secrets for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'driver');

-- The key itself (replace KEY_AQUI; it is in no file of the repository):
-- insert into game_secrets (name, value) values ('secret-cultist-dlc', 'KEY_AQUI')
--   on conflict (name) do update set value = excluded.value;

-- The roles, after creating the two users in Authentication -> Users (Add user, with "Auto Confirm User"):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role": "pedestrian"}' where email = 'visitante@secretcultist.app';
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role": "driver"}' where email = 'SEU_EMAIL';
