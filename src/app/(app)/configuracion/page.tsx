import { redirect } from "next/navigation";

import { ConfiguracionView } from "@/components/configuracion/configuracion-view";
import { getClinicSettings } from "@/lib/supabase/clinic-settings";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const profileResult = await getCurrentProfile();
  if (profileResult.error || !profileResult.profile) {
    redirect("/login");
  }

  const profile = profileResult.profile;
  const admin = isAdmin(profile);

  let clinicSettings = null;
  let clinicSettingsError: string | null = null;

  if (admin) {
    const result = await getClinicSettings();
    clinicSettings = result.data;
    clinicSettingsError = result.error ? (result.message ?? null) : null;
  }

  return (
    <ConfiguracionView
      profile={profile}
      clinicSettings={clinicSettings}
      clinicSettingsError={clinicSettingsError}
    />
  );
}
