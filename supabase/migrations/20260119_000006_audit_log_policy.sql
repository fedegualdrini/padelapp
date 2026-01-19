-- Allow audit trigger inserts while keeping audit_log protected
create policy audit_log_insert on audit_log
  for insert
  with check (true);
