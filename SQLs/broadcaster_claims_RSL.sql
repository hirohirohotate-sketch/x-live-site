alter table public.broadcaster_claims enable row level security;

-- 誰でも読めない（自分の申請のみ読める）
create policy "claims_read_own"
on public.broadcaster_claims for select
to authenticated
using (requester_user_id = auth.uid());

-- 認証済みユーザーは作成可能
create policy "claims_insert_authenticated"
on public.broadcaster_claims for insert
to authenticated
with check (requester_user_id = auth.uid());

-- 自分の申請のみ更新可能（statusの変更等）
create policy "claims_update_own"
on public.broadcaster_claims for update
to authenticated
using (requester_user_id = auth.uid())
with check (requester_user_id = auth.uid());

-- 削除は自分の申請のみ
create policy "claims_delete_own"
on public.broadcaster_claims for delete
to authenticated
using (requester_user_id = auth.uid());
