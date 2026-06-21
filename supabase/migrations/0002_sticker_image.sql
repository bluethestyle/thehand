-- 이미지 스티커(kind='image') 허용 — 기존 DB의 kind 체크 제약 갱신
-- (이미 0001을 새로 적용한 경우엔 불필요)
alter table public.thehand_stickers
  drop constraint if exists thehand_stickers_kind_check;
alter table public.thehand_stickers
  add constraint thehand_stickers_kind_check
  check (kind in ('ribbon','circle','pill','badge','priceCard','image','text'));
