import { randomUUID } from "node:crypto";
import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";
import type { PageType } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_COLMAP: Record<string, string> = {
  title: "title",
  subtitle: "subtitle",
  sectionTag: "section_tag",
  themeColor: "theme_color",
  imageUrl: "image_url",
  isHidden: "is_hidden",
};

type Row = { id: string; type: string; is_fixed?: boolean; sort_order: number };

/** 전체 페이지를 sort_order 순으로 가져오기 */
async function fetchOrdered(sb: ReturnType<typeof adminClient>) {
  const { data, error } = await sb
    .from("thehand_pages")
    .select("id, type, is_fixed, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}

/** id 순서대로 sort_order 1..N 재기록 — 단일 upsert(원자적). type 포함(NOT NULL 보존). */
async function normalize(
  sb: ReturnType<typeof adminClient>,
  ordered: { id: string; type: string }[]
) {
  const rows = ordered.map((p, i) => ({ id: p.id, type: p.type, sort_order: i + 1 }));
  const { error } = await sb.from("thehand_pages").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

/** 순서 변경 / 숨김 토글 / 필드 수정 */
export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    orderedIds?: string[];
    id?: string;
    isHidden?: boolean;
    patch?: Record<string, unknown>;
  };
  const sb = adminClient();

  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    const ids = body.orderedIds;
    let cur: Row[];
    try {
      cur = await fetchOrdered(sb);
    } catch (e) {
      return fail((e as Error).message, 500);
    }
    const currentOrder = cur.map((p) => p.id);
    if (ids.length !== currentOrder.length || ids.some((id) => !currentOrder.includes(id)))
      return fail("페이지 목록이 일치하지 않습니다.", 409);
    // 고정 페이지(표지/원산지표기)는 위치 변경 불가
    for (const p of cur) {
      if (p.is_fixed && ids.indexOf(p.id) !== currentOrder.indexOf(p.id))
        return fail("고정 페이지는 이동할 수 없습니다.", 409);
    }
    const byId = new Map(cur.map((p) => [p.id, p]));
    try {
      await normalize(sb, ids.map((id) => byId.get(id)!));
    } catch (e) {
      return fail((e as Error).message, 500);
    }
    return ok();
  }

  if (body.action === "visibility" && body.id) {
    const { error } = await sb
      .from("thehand_pages")
      .update({ is_hidden: !!body.isHidden })
      .eq("id", body.id);
    if (error) return fail(error.message, 500);
    return ok();
  }

  if (body.action === "update" && body.id && body.patch) {
    const upd: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.patch)) {
      const col = PAGE_COLMAP[k];
      if (col) upd[col] = v;
    }
    if (Object.keys(upd).length === 0) return fail("변경할 필드가 없습니다.");
    const { error } = await sb.from("thehand_pages").update(upd).eq("id", body.id);
    if (error) return fail(error.message, 500);
    return ok();
  }

  return fail("알 수 없는 action.");
}

/** 새 이미지/이벤트 페이지 삽입 — 삽입 후 전체 순서를 원자적으로 재정규화 */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  const { type, afterSortOrder, title } = (await req.json().catch(() => ({}))) as {
    type?: PageType;
    afterSortOrder?: number;
    title?: string;
  };
  if (type !== "image" && type !== "event")
    return fail("삽입 가능한 타입은 image / event 입니다.");

  const sb = adminClient();
  const id = `p-${randomUUID().slice(0, 8)}`;

  let existing: Row[];
  try {
    existing = await fetchOrdered(sb);
  } catch (e) {
    return fail((e as Error).message, 500);
  }

  // 새 행 삽입(임시 sort_order는 정규화 단계에서 덮어씀)
  const { error: insErr } = await sb.from("thehand_pages").insert({
    id,
    type,
    title: title ?? (type === "event" ? "새 이벤트" : "새 이미지 페이지"),
    section_tag: type === "event" ? "이벤트" : "限定",
    theme_color: type === "event" ? "#C0392B" : "#1F8A5B",
    is_hidden: false,
    is_fixed: false,
    sort_order: 1_000_000,
  });
  if (insErr) return fail(insErr.message, 500);

  // 삽입 위치 계산: afterSortOrder 이하 페이지들 바로 뒤
  const base = typeof afterSortOrder === "number" ? afterSortOrder : Infinity;
  const insertIdx = existing.filter((p) => p.sort_order <= base).length;
  const ordered = [...existing];
  ordered.splice(insertIdx, 0, { id, type, sort_order: 0 });

  try {
    await normalize(sb, ordered);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
  return ok({ id });
}

/** 페이지 삭제 (고정 페이지 제외) */
export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return fail("id가 필요합니다.");
  const sb = adminClient();
  const { data: page } = await sb
    .from("thehand_pages")
    .select("is_fixed")
    .eq("id", id)
    .maybeSingle();
  if (page?.is_fixed) return fail("고정 페이지는 삭제할 수 없습니다.", 409);
  const { error } = await sb.from("thehand_pages").delete().eq("id", id);
  if (error) return fail(error.message, 500);
  return ok();
}
