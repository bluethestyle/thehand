import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** 브랜딩(로고 URL) 저장. logoUrl=null이면 기본 手 마크로 복원. */
export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;
  const { logoUrl } = (await req.json().catch(() => ({}))) as { logoUrl?: string | null };
  const sb = adminClient();
  const { error } = await sb.from("thehand_settings").upsert(
    {
      key: "branding",
      value: { logoUrl: logoUrl ?? null },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) return fail(error.message, 500);
  return ok();
}
