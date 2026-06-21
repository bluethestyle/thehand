import { NextResponse } from "next/server";
import { getMenuData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMenuData();
  return NextResponse.json(data);
}
