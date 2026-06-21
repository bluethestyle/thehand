import { randomUUID } from "node:crypto";
import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";
import type { Sticker } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 한 페이지의 스티커 배치를 통째로 저장(교체). */
export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;
  const { pageId, stickers } = (await req.json().catch(() => ({}))) as {
    pageId?: string;
    stickers?: Sticker[];
  };
  if (!pageId || !Array.isArray(stickers)) return fail("pageId와 stickers가 필요합니다.");

  const sb = adminClient();
  const { error: delErr } = await sb
    .from("thehand_stickers")
    .delete()
    .eq("page_id", pageId);
  if (delErr) return fail(delErr.message, 500);

  if (stickers.length > 0) {
    const rows = stickers.map((st) => ({
      id: st.id || `st-${randomUUID().slice(0, 8)}`,
      page_id: pageId,
      kind: st.kind,
      text: st.text ?? "",
      sub_text: st.subText ?? null,
      lines: st.lines ?? null,
      color: st.color ?? null,
      x_pct: st.xPct,
      y_pct: st.yPct,
      rotation: st.rotation ?? 0,
      scale: st.scale ?? 1,
      z: st.z ?? 1,
    }));
    const { error } = await sb.from("thehand_stickers").insert(rows);
    if (error) return fail(error.message, 500);
  }
  return ok();
}
