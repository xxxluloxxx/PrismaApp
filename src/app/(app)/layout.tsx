import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProfileError } from "@/components/layout/profile-error";
import { getCurrentProfile } from "@/lib/supabase/profile";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let result: Awaited<ReturnType<typeof getCurrentProfile>>;
  try {
    result = await getCurrentProfile();
  } catch {
    redirect("/login");
  }

  if (result.error === "unauthenticated") {
    redirect("/login");
  }

  if (result.error || !result.profile) {
    return <ProfileError />;
  }

  if (!result.profile.is_active) {
    return <ProfileError />;
  }

  return <AppShell profile={result.profile}>{children}</AppShell>;
}
