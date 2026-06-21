import { getMenuData } from "@/lib/data";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export default async function AdminItems() {
  const data = await getMenuData();
  return <MenuManager items={[...data.items].sort((a, b) => a.sortOrder - b.sortOrder)} />;
}
