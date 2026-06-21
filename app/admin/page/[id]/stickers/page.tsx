import { notFound } from "next/navigation";
import { getMenuData } from "@/lib/data";
import { StickerEditor } from "@/components/admin/StickerEditor";

export const dynamic = "force-dynamic";

export default async function AdminStickerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMenuData();
  const page = data.pages.find((p) => p.id === id);
  if (!page || (page.type !== "image" && page.type !== "event")) notFound();
  return <StickerEditor page={page} />;
}
