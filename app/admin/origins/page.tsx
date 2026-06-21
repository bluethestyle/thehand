import { getMenuData } from "@/lib/data";
import { OriginManager } from "@/components/admin/OriginManager";

export const dynamic = "force-dynamic";

export default async function AdminOrigins() {
  const data = await getMenuData();
  return <OriginManager origins={data.origins ?? []} />;
}
