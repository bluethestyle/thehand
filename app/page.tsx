import { getMenuData } from "@/lib/data";
import { supabaseConfigured } from "@/lib/supabase";
import { MenuDeck } from "@/components/customer/MenuDeck";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getMenuData();
  return <MenuDeck initial={data} realtime={supabaseConfigured} />;
}
