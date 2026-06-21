import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return ok();
}
