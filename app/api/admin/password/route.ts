import { checkPassword, storePassword } from "@/lib/auth";
import { fail, guard, ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** 비밀번호 변경 (현재 비번 확인 후). */
export async function PUT(req: Request) {
  const g = await guard();
  if (g) return g;

  const { current, next } = (await req.json().catch(() => ({}))) as {
    current?: string;
    next?: string;
  };
  if (!next || next.length < 4) return fail("새 비밀번호는 4자 이상이어야 합니다.");
  if (!(await checkPassword(current ?? "")))
    return fail("현재 비밀번호가 올바르지 않습니다.", 401);

  await storePassword(next);
  return ok();
}
