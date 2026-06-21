import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { adminClient } from "@/lib/supabase";
import { fail, guard, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "thehand-assets";
const MAX = 8 * 1024 * 1024;
const ALLOWED = ["logo", "stickers", "pages", "items", "misc"];

// 폴더별 최대 해상도(긴 변 기준, inside-fit)
const RESIZE: Record<string, { w: number; h: number }> = {
  logo: { w: 512, h: 512 },
  items: { w: 700, h: 1000 }, // 보틀(세로)
  stickers: { w: 900, h: 900 },
  pages: { w: 1600, h: 1600 }, // 페이지 배경
  misc: { w: 1200, h: 1200 },
};

/** 이미지 업로드 → 적정 해상도로 리사이즈(webp) → Storage(public) → 공개 URL. 관리자 전용. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folderRaw = (form?.get("folder") as string) || "misc";
  const folder = ALLOWED.includes(folderRaw) ? folderRaw : "misc";

  if (!(file instanceof File)) return fail("이미지 파일이 필요합니다.");
  if (file.size > MAX) return fail("8MB 이하 이미지만 업로드할 수 있습니다.");
  if (!file.type.startsWith("image/")) return fail("이미지 형식만 가능합니다.");

  const input = Buffer.from(await file.arrayBuffer());
  const isSvg = file.type.includes("svg");

  let body: Buffer = input;
  let ext = "png";
  let contentType = file.type || "image/png";

  if (isSvg) {
    // 벡터는 리사이즈 없이 그대로
    ext = "svg";
    contentType = "image/svg+xml";
  } else {
    const dim = RESIZE[folder] ?? RESIZE.misc;
    try {
      body = await sharp(input)
        .rotate() // EXIF 회전 자동 보정(폰 사진)
        .resize({ width: dim.w, height: dim.h, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      ext = "webp";
      contentType = "image/webp";
    } catch {
      // 변환 실패 시 원본 업로드
      body = input;
      ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      contentType = file.type || "image/png";
    }
  }

  const path = `${folder}/${randomUUID()}.${ext}`;
  const sb = adminClient();
  const { error } = await sb.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) return fail(error.message, 500);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl, path });
}
