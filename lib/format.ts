import type { SakeStyle } from "@/lib/types";

/** 가격 포맷: 천단위 콤마, null/미판매 → "—" */
export function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("ko-KR");
}

export interface StyleMeta {
  key: SakeStyle;
  ko: string;
  ja: string;
  color: string;
  tint: string;
  hint: string;
}

/** 4색 스타일 시스템 (README Design Tokens) */
export const STYLE_META: Record<SakeStyle, StyleMeta> = {
  kunshu: {
    key: "kunshu",
    ko: "화사한",
    ja: "薫酒",
    color: "#d4618c",
    tint: "#fbedf3",
    hint: "과실·꽃향 화려",
  },
  soshu: {
    key: "soshu",
    ko: "산뜻한",
    ja: "爽酒",
    color: "#5dade2",
    tint: "#eaf4fb",
    hint: "드라이·청량",
  },
  junshu: {
    key: "junshu",
    ko: "든든한",
    ja: "醇酒",
    color: "#e2a04f",
    tint: "#fbf3e6",
    hint: "쌀 감칠맛",
  },
  jukushu: {
    key: "jukushu",
    ko: "깊은",
    ja: "熟酒",
    color: "#8b6f47",
    tint: "#f1ece4",
    hint: "숙성·농밀",
  },
};

export function styleMeta(style: SakeStyle | null | undefined): StyleMeta | null {
  if (!style) return null;
  return STYLE_META[style] ?? null;
}

/** 뱃지 색 (NEW/추천/계절한정) */
export const BADGE_COLOR: Record<string, string> = {
  NEW: "#d63031",
  추천: "#f39c12",
  계절한정: "#8b6f47",
};

/** 스티커 의미색 → hex */
export const STICKER_COLOR: Record<string, { fill: string; text: string; border?: string }> = {
  season: { fill: "#1f8a5b", text: "#ffffff" },
  event: { fill: "#c0392b", text: "#ffffff" },
  soldout: { fill: "#c84b31", text: "#ffffff" },
  accent: { fill: "#f39c12", text: "#1e1e36" },
  reco: { fill: "#fbf1dc", text: "#a9761c" },
  outline: { fill: "#ffffff", text: "#2d3436", border: "#d8d0c4" },
};

export function stickerColor(color: string | null | undefined) {
  if (!color) return STICKER_COLOR.outline;
  if (color.startsWith("#")) return { fill: color, text: "#ffffff" };
  return STICKER_COLOR[color] ?? STICKER_COLOR.outline;
}

/** 쇼츄 원료 → 색 (피그마 v2-shochu 기준). 좌측 색바 + pill 배경 */
export const SHOCHU_INGREDIENT_COLOR: Record<string, string> = {
  보리: "#C9A24B",
  고구마: "#9B6FB0",
  자색고구마: "#8E5AA0",
  쌀: "#C2B280",
  흑당: "#7A4B2B",
  아와모리: "#4F9DA6",
  생강: "#D98E2B",
};

export function ingredientColor(ingredient: string | null | undefined): string {
  if (!ingredient) return "#9A8F80";
  return SHOCHU_INGREDIENT_COLOR[ingredient] ?? "#9A8F80";
}
