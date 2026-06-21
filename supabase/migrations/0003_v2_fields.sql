-- 0003: v2 디자인(피그마) 신규 필드
-- 쇼츄 원료(색바), 니혼슈 소믈리에/페어링, 요리 원산지노트/하프가격.
-- 원산지 표기(원산지 페이지) 데이터는 thehand_settings(key='origins') JSON으로 관리.

alter table public.thehand_items add column if not exists ingredient  text;
alter table public.thehand_items add column if not exists sommelier   text;
alter table public.thehand_items add column if not exists pairing     text;
alter table public.thehand_items add column if not exists origin_note text;
alter table public.thehand_items add column if not exists half_price  integer;

-- 원산지 표기 기본값(없을 때만). 관리자에서 수정 가능.
insert into public.thehand_settings (key, value)
values (
  'origins',
  '[
    {"id":"or-rice","ingredient":"쌀","origin":"국내산","required":true,"sortOrder":1},
    {"id":"or-gwangeo","ingredient":"광어","origin":"국내산(양식)","sortOrder":2},
    {"id":"or-hanchi","ingredient":"한치","origin":"국내산","sortOrder":3},
    {"id":"or-beef","ingredient":"소고기(와규)","origin":"호주산","required":true,"sortOrder":4},
    {"id":"or-shrimp","ingredient":"새우","origin":"베트남산","sortOrder":5},
    {"id":"or-buckwheat","ingredient":"메밀","origin":"중국산","sortOrder":6},
    {"id":"or-kimchi","ingredient":"배추김치","origin":"배추 국내산 · 고춧가루 중국산","required":true,"sortOrder":7},
    {"id":"or-eggplant","ingredient":"가지","origin":"국내산","sortOrder":8}
  ]'::jsonb
)
on conflict (key) do nothing;
