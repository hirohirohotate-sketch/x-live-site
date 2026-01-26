-- 1) broadcasters: 棚（配信者）
create table if not exists public.broadcasters (
  id uuid primary key default gen_random_uuid(),
  x_username text not null,
  x_user_id text null, -- 将来OAuthで埋める（数値IDを文字列で保持でOK）
  status text not null default 'unclaimed' check (status in ('unclaimed','pending','claimed')),
  owner_user_id uuid null references auth.users(id) on delete set null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists broadcasters_username_uidx on public.broadcasters (lower(x_username));
create index if not exists broadcasters_owner_idx on public.broadcasters (owner_user_id);
create index if not exists broadcasters_x_user_id_idx on public.broadcasters (x_user_id);

-- updated_at 自動更新（必要ならトリガー追加）
-- （Supabaseは更新時にアプリ側で updated_at を更新してもOK）

-- 2) broadcasts: 配信アーカイブ
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  broadcast_id text not null,           -- /i/broadcasts/<id>
  broadcast_url text not null,          -- 正規化済みURL (https://x.com/i/broadcasts/<id>)
  broadcaster_id uuid null references public.broadcasters(id) on delete set null,
  x_username text null,                -- broadcaster_idがnullでも表示できる保険
  x_user_id text null,                 -- 取れたら
  tweet_id text null,
  tweet_url text null,
  published_at timestamptz null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source text not null default 'api_recent_search',
  public_metrics jsonb null,            -- like/rt等（取れるなら）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists broadcasts_broadcast_id_uidx on public.broadcasts (broadcast_id);
create index if not exists broadcasts_broadcaster_idx on public.broadcasts (broadcaster_id);
create index if not exists broadcasts_username_idx on public.broadcasts (lower(x_username));
create index if not exists broadcasts_published_at_idx on public.broadcasts (published_at desc);

-- 3) broadcast_notes: 文章・タイムスタンプ（価値の核）
create table if not exists public.broadcast_notes (
  id uuid primary key default gen_random_uuid(),
  broadcast_id text not null references public.broadcasts(broadcast_id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  title text null,
  body text not null default '',
  tags text[] not null default '{}',
  timestamps jsonb not null default '[]'::jsonb, -- [{"t":"00:12","note":"開始"}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_broadcast_id_idx on public.broadcast_notes (broadcast_id);
create index if not exists notes_author_idx on public.broadcast_notes (author_user_id);

-- 4) broadcaster_claims: クレーム方式（OAuth前のなりすまし対策）
create table if not exists public.broadcaster_claims (
  id uuid primary key default gen_random_uuid(),
  x_username text not null,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  verification_code text not null,
  method text not null check (method in ('bio','tweet')),
  status text not null default 'pending' check (status in ('pending','verified','expired')),
  created_at timestamptz not null default now(),
  verified_at timestamptz null
);

create index if not exists claims_username_idx on public.broadcaster_claims (lower(x_username));
create index if not exists claims_requester_idx on public.broadcaster_claims (requester_user_id);
