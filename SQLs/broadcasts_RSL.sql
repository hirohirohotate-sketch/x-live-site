alter table public.broadcasts enable row level security;

-- 誰でも読める
create policy "broadcasts_read_all"
on public.broadcasts for select
to public
using (true);

-- MVP: 誰でも追加できる（将来は認証必須に変更予定）
create policy "broadcasts_insert_public"
on public.broadcasts for insert
to public
with check (true);

-- MVP: 誰でも更新できる（将来は認証必須に変更予定）
create policy "broadcasts_update_public"
on public.broadcasts for update
to public
using (true)
with check (true);
