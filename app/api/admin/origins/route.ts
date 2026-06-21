import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";
import type { OriginRow } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 원산지 표기 목록 전체 저장(설정 key='origins'). */
export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;

  const body = (await req.json().catch(() => ({}))) as { origins?: OriginRow[] };
  const list = body.origins;
  if (!Array.isArray(list)) return fail("origins 배열이 필요합니다.");

  // 정규화 + 빈 재료 제거
  const clean: OriginRow[] = list
    .filter((r) => r && typeof r.ingredient === "string" && r.ingredient.trim())
    .map((r, i) => ({
      id: r.id || `or-${i}-${Date.now().toString(36)}`,
      ingredient: r.ingredient.trim(),
      origin: (r.origin ?? "").trim(),
      required: !!r.required,
      sortOrder: i + 1,
    }));

  const sb = adminClient();
  const { error } = await sb.from("thehand_settings").upsert(
    { key: "origins", value: clean, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return fail(error.message, 500);
  return ok({ origins: clean });
}
