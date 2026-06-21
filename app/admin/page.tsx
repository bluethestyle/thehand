import { getMenuData } from "@/lib/data";
import { buildRenderedPages } from "@/lib/menu";
import { PageBoard } from "@/components/admin/PageBoard";

export const dynamic = "force-dynamic";

export default async function AdminPageBoard() {
  const data = await getMenuData();
  const visibleCount = buildRenderedPages(data).length;

  const itemCounts: Record<string, number> = {};
  const soldoutCounts: Record<string, number> = {};
  for (const it of data.items) {
    if (it.status === "closed") continue;
    itemCounts[it.categoryKey] = (itemCounts[it.categoryKey] ?? 0) + 1;
    if (it.status === "soldout")
      soldoutCounts[it.categoryKey] = (soldoutCounts[it.categoryKey] ?? 0) + 1;
  }

  return (
    <PageBoard
      pages={[...data.pages].sort((a, b) => a.sortOrder - b.sortOrder)}
      itemCounts={itemCounts}
      soldoutCounts={soldoutCounts}
      visibleCount={visibleCount}
    />
  );
}
