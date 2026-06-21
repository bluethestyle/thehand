import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** 표시 밀도(페이지당 항목 수 + 글자크기 오프셋) 저장. */
export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;
  const { itemsPerPage, fontScaleOffset } = (await req.json().catch(() => ({}))) as {
    itemsPerPage?: number;
    fontScaleOffset?: number;
  };
  const n = Math.round(Number(itemsPerPage));
  if (!Number.isFinite(n) || n < 2 || n > 10)
    return fail("페이지당 항목 수는 2~10 입니다.");
  const rawOff = Math.round(Number(fontScaleOffset));
  const off = Number.isFinite(rawOff) ? Math.max(-2, Math.min(2, rawOff)) : 0;

  const sb = adminClient();
  const { error } = await sb.from("thehand_settings").upsert(
    {
      key: "density",
      value: { itemsPerPage: n, fontScaleOffset: off },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) return fail(error.message, 500);
  return ok();
}
