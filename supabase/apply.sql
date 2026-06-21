-- THE HAND — 스키마 + 시드 한 번에 적용 (SQL Editor에 통째로 붙여넣고 Run)
-- (migrations/0001_init.sql + seed.sql 합본)

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
              check (kind in ('ribbon','circle','pill','badge','priceCard','image','text')),
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

-- ========================= SEED =========================

-- ============================================================
-- THE HAND — 시드 데이터 (8종 니혼슈 + 페이지 + 스티커 + 설정)
-- 0001_init.sql 실행 후 한 번 실행. 재실행해도 안전(upsert).
-- ============================================================

-- ── 설정: 표시 밀도 ──
insert into public.thehand_settings (key, value) values
  ('density', '{"itemsPerPage": 8, "fontScaleOffset": 0}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── 메뉴 항목: 니혼슈 8종 ──
insert into public.thehand_items
  (id, category_key, band_key, name, brewery, grade, region, style, description,
   polish, smv, acidity, abv, price_glass, price_tokkuri, price_bottle,
   status, badge, featured, heatable, flag_note, map_x, map_y, sort_order)
values
  ('emishiki-monsoon','nihonshu','junmai-daiginjo','에미시키 몬순','에미시키','준마이다이긴죠',null,'kunshu',
   '트로피컬한 향과 달콤함, 열대과실의 화려함.',
   50,'비공개','비공개',17, 18500,53000,106000, 'selling','추천',true,false,null, 35,85, 1),
  ('zaku-nakadori','nihonshu','junmai-daiginjo','자쿠 나카도리','시미즈세이자부로','준마이다이긴죠','미에','kunshu',
   '가장 맑고 깨끗한 나카도리. 실크 같은 감촉.',
   50,'+1','1.6',16, 22500,65000,130000, 'selling',null,false,false,null, 55,78, 2),
  ('chiyomusubi-gouriki','nihonshu','junmai-daiginjo','치요무스비 고우리키','치요무스비','준마이다이긴죠','돗토리','jukushu',
   '숙성될수록 깊어지는 강력한 감칠맛. 차게.',
   50,'+6','1.6',16, 14500,41000,82000, 'soldout',null,false,false,null, 66,56, 3),
  ('kinoene-junmai-ginjo','nihonshu','junmai-ginjo','키노에네 준마이긴죠','이이누마혼케','준마이긴죠','치바','soshu',
   '청사과의 상큼함과 약한 탄산감, 좋은 목넘김.',
   65,'±0','1.4',16, 12000,34500,69000, 'selling','NEW',false,false,null, 62,45, 4),
  ('suigei-kouiku','nihonshu','junmai-ginjo','스이게이 코우이쿠','스이게이주조','준마이긴죠','고치','junshu',
   '쌀의 또렷한 감칠맛과 은은한 긴죠향.',
   50,'+7','1.8',16, 16000,45500,null, 'selling',null,false,false,'도쿠리·잔술만', 70,36, 5),
  ('iyo-kagiya-muroka','nihonshu','junmai-ginjo','이요카기야 무여과','카기야','준마이긴죠','에히메','junshu',
   '쌀의 감칠맛을 살린 폭넓은 식중주.',
   50,'+4','1.7',15.5, 13500,38500,77000, 'selling',null,false,true,null, 58,42, 6),
  ('hakujuro-akazura','nihonshu','junmai','하쿠주로 아카즈라','하쿠주로','준마이','효고','soshu',
   '+12 Extra Dry. 담백하고 자극을 절제.',
   70,'+12','1.6',15.5, 16300,46500,93000, 'selling',null,false,true,null, 90,28, 7),
  ('kuzuryu-junmai','nihonshu','junmai','쿠즈류 준마이','코쿠류','준마이','후쿠이','jukushu',
   '잘 익은 바나나 아로마에 곡물감. 만능주.',
   65,'+5.5','비공개',14.5, 13500,38500,111000, 'selling','계절한정',false,false,'여름 한정', 42,52, 8)
on conflict (id) do update set
  category_key=excluded.category_key, band_key=excluded.band_key, name=excluded.name,
  brewery=excluded.brewery, grade=excluded.grade, region=excluded.region, style=excluded.style,
  description=excluded.description, polish=excluded.polish, smv=excluded.smv, acidity=excluded.acidity,
  abv=excluded.abv, price_glass=excluded.price_glass, price_tokkuri=excluded.price_tokkuri,
  price_bottle=excluded.price_bottle, status=excluded.status, badge=excluded.badge,
  featured=excluded.featured, heatable=excluded.heatable, flag_note=excluded.flag_note,
  map_x=excluded.map_x, map_y=excluded.map_y, sort_order=excluded.sort_order;

-- ── 페이지 ──
insert into public.thehand_pages
  (id, type, title, subtitle, section_tag, category_key, map_kind, theme_color, is_hidden, is_fixed, sort_order)
values
  ('p-cover','cover','THE HAND','사케 바 · 디지털 메뉴판',null,null,null,null,false,true,1),
  ('p-nihonshu','menu','니혼슈','지역·등급으로 고르는 사케 · 모두 차게 제공','日本酒','nihonshu',null,null,false,false,2),
  ('p-kubota-limited','image','한정주',null,'限定',null,null,'#1F8A5B',false,false,3),
  ('p-region-map','map','산지 지도','어느 지역(현)에서 온 사케인지 둘러보기','産地',null,'region',null,false,false,4),
  ('p-taste-map','map','취향 지도','달콤↔깔끔 · 화려↔은은으로 내 취향 찾기','探索',null,'taste',null,false,false,5),
  ('p-shochu','menu','쇼츄','본격 증류주','焼酎','shochu',null,null,false,false,6),
  ('p-yori','menu','요리','사케와 어울리는 안주','料理','yori',null,null,false,false,7),
  ('p-event','event','이벤트',null,'이벤트',null,null,'#C0392B',false,false,8),
  ('p-drinks','menu','음료','준비 중','飲料','drinks',null,null,true,false,9),
  ('p-notice','notice','원산지 표기','법정 표기 사항',null,null,null,null,false,true,10)
on conflict (id) do update set
  type=excluded.type, title=excluded.title, subtitle=excluded.subtitle, section_tag=excluded.section_tag,
  category_key=excluded.category_key, map_kind=excluded.map_kind, theme_color=excluded.theme_color,
  is_hidden=excluded.is_hidden, is_fixed=excluded.is_fixed, sort_order=excluded.sort_order;

-- ── 스티커 ──
delete from public.thehand_stickers where page_id in ('p-kubota-limited','p-event');
insert into public.thehand_stickers
  (id, page_id, kind, text, sub_text, lines, color, x_pct, y_pct, rotation, scale, z)
values
  ('st-season','p-kubota-limited','ribbon','계절 한정주',null,null,'season',20,15,-6,1,2),
  ('st-count','p-kubota-limited','circle','한정','30병',null,'soldout',81,17,9,1,3),
  ('st-glassonly','p-kubota-limited','pill','잔술만 가능',null,null,'outline',69,31,5,1,2),
  ('st-price','p-kubota-limited','priceCard','쿠보타 만쥬 (니가타)',null,
   '[{"label":"잔술 100㎖","value":"24,000"},{"label":"보틀 720㎖","value":"280,000"}]'::jsonb,
   null,44,70,-3,1,4),
  ('ev-anniv','p-event','ribbon','10주년 이벤트',null,null,'event',23,15,-5,1,2),
  ('ev-june','p-event','badge','6월 한정',null,null,'accent',75,18,6,1,2),
  ('ev-keep','p-event','priceCard','키핑 보너스','키핑 1병당 잔술 1잔 무료',null,null,41,51,-2,1,4),
  ('ev-period','p-event','pill','기간 6/1 – 6/30',null,null,'outline',60,79,3,1,2);
