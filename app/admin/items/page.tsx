import { getMenuData } from "@/lib/data";
import { ItemManager } from "@/components/admin/ItemManager";

export const dynamic = "force-dynamic";

export default async function AdminItems() {
  const data = await getMenuData();
  return (
    <ItemManager items={[...data.items].sort((a, b) => a.sortOrder - b.sortOrder)} />
  );
}
