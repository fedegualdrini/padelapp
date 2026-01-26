-- Add sender JID identity mapping for WhatsApp when WhatsApp emits LID sender ids.
-- This avoids relying on phone_e164 when SenderJID is not a phone JID.

create table if not exists whatsapp_sender_identities (
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  sender_jid text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, sender_jid),
  unique (group_id, player_id)
);

create index if not exists idx_whatsapp_sender_identities_player on whatsapp_sender_identities(group_id, player_id);

alter table whatsapp_sender_identities enable row level security;

create policy member_select_whatsapp_sender_identities on whatsapp_sender_identities
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = whatsapp_sender_identities.group_id and gm.user_id = auth.uid()
  ));

grant select on table whatsapp_sender_identities to anon, authenticated;
