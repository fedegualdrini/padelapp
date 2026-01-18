-- Seed data for padel app
-- Replace player names below as needed.

insert into groups (id, name, slug, passphrase_hash)
values (
  '00000000-0000-0000-0000-000000000001',
  'Padel Group',
  'padel',
  crypt('padel', gen_salt('bf'))
);

insert into players (group_id, name, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Fachi', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Lucho', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Leo', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Nico', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Fede', 'usual');
