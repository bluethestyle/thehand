import { getMenuData } from "@/lib/data";
import { BrandingSettings } from "@/components/admin/BrandingSettings";

export const dynamic = "force-dynamic";

export default async function AdminBranding() {
  const data = await getMenuData();
  return <BrandingSettings initialLogoUrl={data.branding.logoUrl} />;
}
