-- Ensure new groups always get a share token

alter table public.groups
  alter column ranking_share_token set default encode(gen_random_bytes(16), 'hex');

update public.groups
  set ranking_share_token = encode(gen_random_bytes(16), 'hex')
where ranking_share_token is null;
