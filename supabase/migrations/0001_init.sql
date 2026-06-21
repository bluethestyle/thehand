-- ============================================================
-- THE HAND 디지털 메뉴판 — 스키마 (기존 Supabase 프로젝트에 추가)
-- 다른 앱과 충돌 방지: 모든 객체에 thehand_ 접두사.
-- 보안: 손님(anon)은 읽기 전용, 관리자 쓰기는 service_role(서버 라우트)만.
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.
-- ============================================================

-- ── 메뉴 항목 ────────────────────────────────────────────────
create table if not exists public.thehand_items (
  id            text primary key,
  category_key  text not null,
  band_key      text,
  name          text not null,
  brewery       text,
  grade         text,
  region        text,
  style         text check (style in ('kunshu','soshu','junshu','jukushu')),
  description   text,
  polish        numeric,
  smv           text,
  acidity       text,
  abv           numeric,
  price_glass   integer,
  price_tokkuri integer,
  price_bottle  integer,
  status        text not null default 'selling'
                  check (status in ('selling','soldout','closed')),
  badge         text check (badge in ('NEW','추천','계절한정')),
  featured      boolean not null default false,
  heatable      boolean not null default false,
  flag_note     text,
  image_url     text,
  map_x         numeric,
  map_y         numeric,
  sort_order    integer not null default 0,
  closed_at     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 페이지(페이지 보드) ───────────────────────────────────────
create table if not exists public.thehand_pages (
  id           text primary key,
  type         text not null
                 check (type in ('cover','menu','image','event','map','notice')),
  title        text,
  subtitle     text,
  section_tag  text,
  category_key text,
  map_kind     text check (map_kind in ('region','taste')),
  theme_color  text,
  image_url    text,
  is_hidden    boolean not null default false,
  is_fixed     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 스티커(이미지/이벤트 페이지 오버레이) ─────────────────────
create table if not exists public.thehand_stickers (
  id        text primary key,
  page_id   text not null references public.thehand_pages(id) on delete cascade,
  kind      text not null
              check (kind in ('ribbon','circle','pill','badge','priceCard','text')),
  text      text not null default '',
  sub_text  text,
  lines     jsonb,
  color     text,
  x_pct     numeric not null default 50,
  y_pct     numeric not null default 50,
  rotation  numeric not null default 0,
  scale     numeric not null default 1,
  z         integer not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists thehand_stickers_page_idx on public.thehand_stickers(page_id);

-- ── 설정(밀도 등, 손님도 읽음) ────────────────────────────────
create table if not exists public.thehand_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── 관리자 비밀번호(손님 접근 금지) ───────────────────────────
create table if not exists public.thehand_admin (
  id            integer primary key default 1 check (id = 1),
  password_hash text,
  password_salt text,
  updated_at    timestamptz not null default now()
);
insert into public.thehand_admin (id) values (1)
  on conflict (id) do nothing;

-- ── RLS ──────────────────────────────────────────────────────
alter table public.thehand_items    enable row level security;
alter table public.thehand_pages    enable row level security;
alter table public.thehand_stickers enable row level security;
alter table public.thehand_settings enable row level security;
alter table public.thehand_admin    enable row level security;

-- 손님(anon/authenticated): 읽기만 허용. 쓰기 정책 없음 → service_role만 가능.
do $$
begin
  -- items
  if not exists (select 1 from pg_policies where policyname = 'thehand_items_read') then
    create policy thehand_items_read on public.thehand_items for select using (true);
  end if;
  -- pages
  if not exists (select 1 from pg_policies where policyname = 'thehand_pages_read') then
    create policy thehand_pages_read on public.thehand_pages for select using (true);
  end if;
  -- stickers
  if not exists (select 1 from pg_policies where policyname = 'thehand_stickers_read') then
    create policy thehand_stickers_read on public.thehand_stickers for select using (true);
  end if;
  -- settings
  if not exists (select 1 from pg_policies where policyname = 'thehand_settings_read') then
    create policy thehand_settings_read on public.thehand_settings for select using (true);
  end if;
  -- admin: 정책 없음 → anon/authenticated 접근 전면 차단(service_role만 우회)
end $$;

-- ── Realtime (관리 변경 → 모든 태블릿 즉시 반영) ──────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.thehand_items;
    alter publication supabase_realtime add table public.thehand_pages;
    alter publication supabase_realtime add table public.thehand_stickers;
    alter publication supabase_realtime add table public.thehand_settings;
  end if;
exception when duplicate_object then
  null;
end $$;

-- updated_at 자동 갱신
create or replace function public.thehand_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'thehand_items_touch') then
    create trigger thehand_items_touch before update on public.thehand_items
      for each row execute function public.thehand_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'thehand_pages_touch') then
    create trigger thehand_pages_touch before update on public.thehand_pages
      for each row execute function public.thehand_touch_updated_at();
  end if;
end $$;
