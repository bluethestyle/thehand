import { getMenuData } from "@/lib/data";
import { DensityControl } from "@/components/admin/DensityControl";

export const dynamic = "force-dynamic";

export default async function AdminDensity() {
  const data = await getMenuData();
  const nihonshu = data.items
    .filter((i) => i.categoryKey === "nihonshu" && i.status !== "closed")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return <DensityControl initial={data.density} items={nihonshu} />;
}
