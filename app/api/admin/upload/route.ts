import { randomUUID } from "node:crypto";
import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const BUCKET = "thehand-assets";
const MAX = 5 * 1024 * 1024;
const ALLOWED = ["logo", "stickers", "pages", "misc"];

/** 이미지 업로드 → Supabase Storage(public) → 공개 URL 반환. 관리자 전용. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folderRaw = (form?.get("folder") as string) || "misc";
  const folder = ALLOWED.includes(folderRaw) ? folderRaw : "misc";

  if (!(file instanceof File)) return fail("이미지 파일이 필요합니다.");
  if (file.size > MAX) return fail("5MB 이하 이미지만 업로드할 수 있습니다.");
  if (!file.type.startsWith("image/")) return fail("이미지 형식만 가능합니다.");

  const ext =
    (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "png";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const sb = adminClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) return fail(error.message, 500);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl, path });
}
