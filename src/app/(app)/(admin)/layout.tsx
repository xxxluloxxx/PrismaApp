import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentProfile();
  if (result.error || !result.profile || !isAdmin(result.profile)) {
    redirect("/dashboard");
  }
  return children;
}
