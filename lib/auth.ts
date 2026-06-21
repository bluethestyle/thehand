import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { adminClient, adminConfigured } from "@/lib/supabase";

export const ADMIN_COOKIE = "thehand_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12시간

// 미설정 시에도 공개 소스의 고정 비밀을 쓰지 않도록 프로세스 단위 랜덤 폴백.
// (이 경로는 Supabase 미설정=데모 모드에서만 닿으며, 세션이 의미 없음)
const EPHEMERAL_SECRET = randomBytes(32).toString("hex");

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    EPHEMERAL_SECRET
  );
}

// ── 비밀번호 해시 (scrypt) ─────────────────────────────────
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ── 세션 토큰 (서명 쿠키, 무상태) ──────────────────────────
function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const payload = `${role}.${expStr}`;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return role === "admin";
}

// ── 관리자 비밀번호 저장소 (thehand_admin) ─────────────────
export async function getStoredPassword(): Promise<{
  hash: string | null;
  salt: string | null;
}> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("thehand_admin")
    .select("password_hash, password_salt")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return { hash: data?.password_hash ?? null, salt: data?.password_salt ?? null };
}

export async function isPasswordSet(): Promise<boolean> {
  if (!adminConfigured) return false;
  const { hash, salt } = await getStoredPassword();
  return Boolean(hash && salt);
}

export async function storePassword(password: string): Promise<void> {
  const sb = adminClient();
  const { hash, salt } = hashPassword(password);
  const { error } = await sb
    .from("thehand_admin")
    .upsert(
      { id: 1, password_hash: hash, password_salt: salt, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  if (error) throw error;
}

export async function checkPassword(password: string): Promise<boolean> {
  const { hash, salt } = await getStoredPassword();
  if (!hash || !salt) return false;
  return verifyPassword(password, hash, salt);
}

// ── 요청별 관리자 인증 확인 ────────────────────────────────
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
