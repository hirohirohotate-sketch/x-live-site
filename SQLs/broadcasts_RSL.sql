alter table public.broadcasts enable row level security;

create policy "broadcasts_read_all"
on public.broadcasts for select
to public
using (true);

create policy "broadcasts_insert_authenticated"
on public.broadcasts for insert
to authenticated
with check (true);

create policy "broadcasts_update_authenticated"
on public.broadcasts for update
to authenticated
using (true)
with check (true);
