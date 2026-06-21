import { notFound } from "next/navigation";
import { getMenuData } from "@/lib/data";
import { ItemEditForm } from "@/components/admin/ItemEditForm";

export const dynamic = "force-dynamic";

export default async function AdminItemEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMenuData();
  const item = data.items.find((it) => it.id === id);
  if (!item) notFound();
  return <ItemEditForm item={item} />;
}
