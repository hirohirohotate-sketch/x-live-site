-- 既存のポリシーを削除
DROP POLICY IF EXISTS "broadcasts_insert_authenticated" ON public.broadcasts;
DROP POLICY IF EXISTS "broadcasts_update_authenticated" ON public.broadcasts;

-- 新しいポリシーを作成（MVP用：誰でも追加・更新可能）
CREATE POLICY "broadcasts_insert_public"
ON public.broadcasts FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "broadcasts_update_public"
ON public.broadcasts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
