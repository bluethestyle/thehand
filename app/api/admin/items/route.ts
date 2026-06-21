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
  ingredient: "ingredient",
  sommelier: "sommelier",
  pairing: "pairing",
  originNote: "origin_note",
  halfPrice: "half_price",
  bandKey: "band_key",
  categoryKey: "category_key",
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

/** 새 메뉴 생성 또는 순서 변경(action:"reorder"). */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    orderedIds?: string[];
    categoryKey?: string;
    name?: string;
    bandKey?: string | null;
  };

  const sb = adminClient();

  // 순서 변경: 주어진 id 순서대로 sort_order 1..N 재기록
  if (body.action === "reorder" && Array.isArray(body.orderedIds)) {
    const ids = body.orderedIds;
    const results = await Promise.all(
      ids.map((id, i) =>
        sb.from("thehand_items").update({ sort_order: i + 1 }).eq("id", id)
      )
    );
    const err = results.find((r) => r.error);
    if (err?.error) return fail(err.error.message, 500);
    return ok();
  }

  if (!body.categoryKey) return fail("categoryKey가 필요합니다.");

  // 같은 카테고리 최대 sort_order + 1
  const { data: maxRows } = await sb
    .from("thehand_items")
    .select("sort_order")
    .eq("category_key", body.categoryKey)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (maxRows?.[0]?.sort_order ?? 0) + 1;
  const id = `${body.categoryKey}-${Date.now().toString(36)}`;

  const row = {
    id,
    category_key: body.categoryKey,
    band_key: body.bandKey ?? null,
    name: body.name?.trim() || "새 메뉴",
    status: "selling",
    sort_order: nextOrder,
  };
  const { error } = await sb.from("thehand_items").insert(row);
  if (error) return fail(error.message, 500);
  return ok({ id });
}

/** 메뉴 영구 삭제. */
export async function DELETE(req: Request) {
  const g = await guard();
  if (g) return g;

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return fail("id가 필요합니다.");

  const sb = adminClient();
  const { error } = await sb.from("thehand_items").delete().eq("id", id);
  if (error) return fail(error.message, 500);
  return ok();
}
