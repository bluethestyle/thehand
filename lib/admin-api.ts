import "server-only";
import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { adminConfigured } from "@/lib/supabase";

/** 관리자 쓰기 라우트 진입 가드. 통과 시 null, 아니면 에러 응답. */
export async function guard(): Promise<NextResponse | null> {
  if (!adminConfigured) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다 (.env.local)." },
      { status: 503 }
    );
  }
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }
  return null;
}

/** "닫은 날" 표기용 M/D */
export function mmdd(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
