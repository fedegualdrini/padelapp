-- Add slug to groups for multi-tenant routing
alter table groups add column slug text;
update groups set slug = 'padel' where slug is null;
alter table groups alter column slug set not null;
create unique index if not exists groups_slug_unique on groups(slug);
