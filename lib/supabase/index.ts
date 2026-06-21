/**
 * Supabase 클라이언트 헬퍼.
 *
 * 3가지 용도:
 *  - browserClient(): 손님 태블릿(클라이언트 컴포넌트)에서 읽기 + Realtime 구독. anon 키.
 *  - serverAnonClient(): 서버 컴포넌트(SSR)에서 초기 읽기. anon 키.
 *  - adminClient(): 관리자 쓰기 전용. service_role 키. **서버 라우트에서만** 사용.
 *
 * 환경변수가 없으면 supabaseConfigured === false → 앱은 내장 시드로 읽기 전용 미리보기.
 */
import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** anon(공개) 읽기 경로가 설정되었는가. */
export const supabaseConfigured = Boolean(URL && ANON);

/** 관리자 쓰기 경로(service_role)가 설정되었는가. 서버에서만 의미 있음. */
export const adminConfigured = Boolean(URL && SERVICE);

/** 클라이언트 컴포넌트: 읽기 + Realtime. */
export function browserClient(): SupabaseClient {
  if (!URL || !ANON) {
    throw new Error("Supabase 미설정: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 필요");
  }
  return createBrowserClient(URL, ANON);
}

/** 서버 컴포넌트(SSR) 읽기: 인증 세션 불필요(공개 메뉴). */
export function serverAnonClient(): SupabaseClient {
  if (!URL || !ANON) {
    throw new Error("Supabase 미설정: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 필요");
  }
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 서버 라우트 전용: service_role 로 RLS 우회 쓰기. 절대 클라이언트로 노출 금지. */
export function adminClient(): SupabaseClient {
  if (!URL || !SERVICE) {
    throw new Error("Supabase 관리자 미설정: SUPABASE_SERVICE_ROLE_KEY 필요");
  }
  return createClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
