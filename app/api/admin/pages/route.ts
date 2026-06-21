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
    let i = 1;
    for (const id of body.orderedIds) {
      const { error } = await sb
        .from("thehand_pages")
        .update({ sort_order: i++ })
        .eq("id", id);
      if (error) return fail(error.message, 500);
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

/** 새 이미지/이벤트 페이지 삽입 */
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
  const base = typeof afterSortOrder === "number" ? afterSortOrder : 999;

  // 뒤 페이지들 한 칸씩 밀기
  const { data: after } = await sb
    .from("thehand_pages")
    .select("id, sort_order")
    .gt("sort_order", base)
    .order("sort_order", { ascending: true });
  for (const p of after ?? []) {
    await sb
      .from("thehand_pages")
      .update({ sort_order: (p.sort_order as number) + 1 })
      .eq("id", p.id);
  }

  const { error } = await sb.from("thehand_pages").insert({
    id,
    type,
    title: title ?? (type === "event" ? "새 이벤트" : "새 이미지 페이지"),
    section_tag: type === "event" ? "이벤트" : "限定",
    theme_color: type === "event" ? "#C0392B" : "#1F8A5B",
    is_hidden: false,
    is_fixed: false,
    sort_order: base + 1,
  });
  if (error) return fail(error.message, 500);
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
