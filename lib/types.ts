/**
 * 더핸드 페이지형 메뉴판 — 도메인 타입.
 * 디자인 스펙: design-reference/spec-1..8.md
 */

export type SakeStyle = "kunshu" | "soshu" | "junshu" | "jukushu";

/** 판매 상태. selling=정상, soldout=일시품절(표시만), closed=닫힘(손님화면 숨김·보관함) */
export type ItemStatus = "selling" | "soldout" | "closed";

export type ItemBadge = "NEW" | "추천" | "계절한정";

/** 등급 밴드(메뉴 페이지 안의 카테고리 헤더). 純米大吟醸 등. */
export interface CategoryBand {
  key: string;
  ja: string; // 純米大吟醸
  ko: string; // 준마이 다이긴죠
  note: string; // 정미보합 50%↓ · 가장 화려
}

export interface MenuItem {
  id: string;
  /** 어느 메뉴 페이지(카테고리)에 속하는가. ex) "nihonshu" */
  categoryKey: string;
  /** 페이지 안의 등급 밴드 key. ex) "junmai-daiginjo" */
  bandKey?: string | null;

  name: string;
  brewery?: string | null; // 양조장 (이름 아래 작은 줄)
  grade?: string | null; // 준마이다이긴죠 (한글)
  region?: string | null; // 후쿠시마
  style?: SakeStyle | null;
  description?: string | null;

  /** 쇼츄 원료 (보리/고구마/쌀/흑당/자색고구마/아와모리/생강) — 좌측 색바 + pill */
  ingredient?: string | null;
  /** 소믈리에 코멘트 (니혼슈 강조 박스) */
  sommelier?: string | null;
  /** 추천 페어링 (니혼슈) */
  pairing?: string | null;
  /** 요리 원산지 노트. ex) "광어 국내산(양식)" */
  originNote?: string | null;
  /** 요리 하프(½) 가격 */
  halfPrice?: number | null;

  // 스펙
  polish?: number | null; // 정미보합 %
  smv?: string | null; // 일본주도 ("+12", "비공개")
  acidity?: string | null; // 산도
  abv?: number | null; // 도수 %

  // 가격 (null = 해당 단위 미판매 → "—")
  priceGlass?: number | null; // 잔술 100㎖
  priceTokkuri?: number | null; // 도쿠리 300㎖
  priceBottle?: number | null; // 보틀 720㎖

  // 플래그
  status: ItemStatus;
  badge?: ItemBadge | null;
  featured?: boolean; // ★ + 형광펜 하이라이트
  heatable?: boolean; // ♨ 데움 가능
  flagNote?: string | null; // 인라인 우측 라벨. ex) "도쿠리·잔술만", "여름 한정"

  imageUrl?: string | null;

  // 취향 지도 좌표 (x: 0 달콤 → 100 깔끔, y: 0 은은 → 100 화려)
  mapX?: number | null;
  mapY?: number | null;

  sortOrder: number;
  /** 닫힌 날짜(보관함 표시용) "M/D" */
  closedAt?: string | null;
}

export type StickerKind =
  | "ribbon" // 깃발/리본형 (계절 한정주)
  | "circle" // 원형 카운트 뱃지 (한정 30병)
  | "pill" // 캡슐 (잔술만 가능)
  | "badge" // 솔리드 사각라운드 뱃지 (NEW/일시 품절/추천)
  | "priceCard" // 흰 카드 + 가격 라인
  | "image" // 업로드 이미지 스티커 (text 필드에 이미지 URL 저장)
  | "text"; // 자유 텍스트

export interface StickerLine {
  label: string; // 잔술 100㎖
  value: string; // 24,000
}

export interface Sticker {
  id: string;
  kind: StickerKind;
  text: string;
  subText?: string | null;
  /** priceCard 전용: 제목 아래 단위/가격 라인들 */
  lines?: StickerLine[] | null;
  /** 의미색 키 또는 hex. ex) "season"(녹색) | "soldout"(빨강) | "accent" | "#1F8A5B" */
  color?: string | null;
  /** 캔버스 대비 백분율 위치(좌상단 기준 중심점) */
  xPct: number;
  yPct: number;
  rotation: number; // deg
  scale: number; // 1 = 기준
  z: number;
}

export type PageType =
  | "cover" // 표지 (고정)
  | "menu" // 텍스트 리스트 (항목 수 초과 시 자동 분할)
  | "image" // 이미지 + 스티커 페이지
  | "event" // 이벤트 이미지 페이지
  | "map" // 탐색 (산지/취향 지도)
  | "notice"; // 원산지 표기 등 (고정)

export type MapKind = "region" | "taste";

/** 페이지 보드(관리①)가 다루는 한 장. */
export interface MenuPage {
  id: string;
  type: PageType;
  title?: string | null; // 니혼슈
  subtitle?: string | null; // 지역·등급으로 고르는 사케 …
  sectionTag?: string | null; // 헤더 우측 한자 태그. ex) 日本酒 / 探索 / 이벤트
  categoryKey?: string | null; // menu 타입: 어떤 항목들을 보여줄지
  mapKind?: MapKind | null;
  themeColor?: string | null; // image/event 테마색 (hex)
  imageUrl?: string | null;
  stickers?: Sticker[];
  isHidden: boolean;
  isFixed?: boolean; // cover/notice = 순서/삭제 잠금
  sortOrder: number;
}

export interface DensitySettings {
  itemsPerPage: number; // 2..10
  fontScaleOffset: number; // -2..+2 (자동 비례값 대비 미세조정 단계)
}

export interface Branding {
  /** 업로드한 로고 마크 이미지 URL. null이면 기본 手 마크. */
  logoUrl: string | null;
}

/** 원산지 표기(법정) 한 줄. 재료 → 원산지. */
export interface OriginRow {
  id: string;
  ingredient: string; // 쌀
  origin: string; // 국내산(양식)
  /** 법정 의무 표기(삭제 시 경고) */
  required?: boolean;
  sortOrder: number;
}

/** 손님 화면에 실제로 펼쳐지는 한 장(자동 분할 결과 포함). */
export interface RenderedPage {
  key: string;
  source: MenuPage;
  /** menu 타입일 때, 이 장에 들어가는 항목들(밴드 포함 순서) */
  items?: MenuItem[];
  /** 분할된 경우: 같은 카테고리에서 몇 번째 / 전체 몇 장 */
  splitIndex?: number;
  splitTotal?: number;
}

export interface MenuData {
  pages: MenuPage[];
  items: MenuItem[];
  bands: Record<string, CategoryBand[]>; // categoryKey → 밴드 목록(순서)
  density: DensitySettings;
  branding: Branding;
  /** 원산지 표기 페이지 데이터(법정) */
  origins?: OriginRow[];
}
