import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/supabase";
import { isPasswordSet } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!adminConfigured) {
    return NextResponse.json({ configured: false, passwordSet: false });
  }
  try {
    return NextResponse.json({ configured: true, passwordSet: await isPasswordSet() });
  } catch {
    return NextResponse.json({ configured: false, passwordSet: false });
  }
}
