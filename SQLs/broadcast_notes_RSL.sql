alter table public.broadcast_notes enable row level security;

create policy "notes_read_all"
on public.broadcast_notes for select
to public
using (true);

-- notes の author が本人であること
create policy "notes_write_self"
on public.broadcast_notes for insert
to authenticated
with check (author_user_id = auth.uid());

create policy "notes_update_self"
on public.broadcast_notes for update
to authenticated
using (author_user_id = auth.uid())
with check (author_user_id = auth.uid());

create policy "notes_delete_self"
on public.broadcast_notes for delete
to authenticated
using (author_user_id = auth.uid());
