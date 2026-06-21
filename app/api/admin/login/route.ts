import { cookies } from "next/headers";
import { adminConfigured } from "@/lib/supabase";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  isPasswordSet,
  sessionCookieOptions,
} from "@/lib/auth";
import { fail, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminConfigured) return fail("Supabase가 설정되지 않았습니다.", 503);
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password) return fail("비밀번호를 입력하세요.");
  if (!(await isPasswordSet())) return fail("비밀번호가 아직 설정되지 않았습니다.", 409);
  if (!(await checkPassword(password)))
    return fail("비밀번호가 올바르지 않습니다.", 401);

  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(), sessionCookieOptions());
  return ok();
}
