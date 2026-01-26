-- Track whether an attendance occurrence has been loaded into a real match

alter table public.event_occurrences
  add column if not exists loaded_match_id uuid references public.matches(id),
  add column if not exists loaded_at timestamptz;

create index if not exists idx_event_occurrences_loaded
  on public.event_occurrences(group_id, status, loaded_match_id);
