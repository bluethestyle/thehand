import { adminClient } from "@/lib/supabase";
import { fail, guard, mmdd, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const COLMAP: Record<string, string> = {
  status: "status",
  badge: "badge",
  featured: "featured",
  heatable: "heatable",
  name: "name",
  description: "description",
  region: "region",
  brewery: "brewery",
  grade: "grade",
  style: "style",
  flagNote: "flag_note",
  priceGlass: "price_glass",
  priceTokkuri: "price_tokkuri",
  priceBottle: "price_bottle",
  polish: "polish",
  smv: "smv",
  acidity: "acidity",
  abv: "abv",
  sortOrder: "sort_order",
  imageUrl: "image_url",
};

/** 항목 상태/필드 변경. 닫힘 시 closed_at 기록, 판매중 복원 시 해제. */
export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;

  const { id, patch } = (await req.json().catch(() => ({}))) as {
    id?: string;
    patch?: Record<string, unknown>;
  };
  if (!id || !patch) return fail("id와 patch가 필요합니다.");

  const upd: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    const col = COLMAP[k];
    if (col) upd[col] = v;
  }
  if (patch.status === "closed") upd.closed_at = mmdd(new Date());
  if (patch.status === "selling") upd.closed_at = null;
  if (Object.keys(upd).length === 0) return fail("변경할 필드가 없습니다.");

  const sb = adminClient();
  const { error } = await sb.from("thehand_items").update(upd).eq("id", id);
  if (error) return fail(error.message, 500);
  return ok();
}
