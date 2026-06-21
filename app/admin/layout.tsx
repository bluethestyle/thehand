import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import { adminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supabase가 설정된 경우엔 반드시 인증 필요(쿠키). 미설정이면 데모(읽기전용) 미리보기 허용.
  if (adminConfigured && !(await isAdminAuthed())) {
    redirect("/");
  }
  return <>{children}</>;
}
