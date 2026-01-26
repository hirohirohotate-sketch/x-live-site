alter table public.broadcasters enable row level security;

create policy "broadcasters_read_all"
on public.broadcasters for select
to public
using (true);

create policy "broadcasters_update_owner_only"
on public.broadcasters for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- insert は運営だけにしたいなら一旦禁止でもOK
create policy "broadcasters_insert_authenticated"
on public.broadcasters for insert
to authenticated
with check (true);
