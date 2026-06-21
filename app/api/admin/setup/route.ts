import { cookies } from "next/headers";
import { adminConfigured } from "@/lib/supabase";
import {
  ADMIN_COOKIE,
  createSessionToken,
  isPasswordSet,
  sessionCookieOptions,
  storePassword,
} from "@/lib/auth";
import { fail, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** 최초 비밀번호 설정 (아직 미설정일 때만). 성공 시 로그인 처리. */
export async function POST(req: Request) {
  if (!adminConfigured) return fail("Supabase가 설정되지 않았습니다.", 503);
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || password.length < 4) return fail("비밀번호는 4자 이상이어야 합니다.");
  if (await isPasswordSet()) return fail("이미 비밀번호가 설정되어 있습니다.", 409);

  await storePassword(password);
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  return ok();
}
