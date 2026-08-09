import { AppearanceCard } from "@/components/configuracion/appearance-card";
import { ClinicSettingsForm } from "@/components/configuracion/clinic-settings-form";
import { NotificationsCard } from "@/components/configuracion/notifications-card";
import { ProfileCard } from "@/components/configuracion/profile-card";
import { SecurityCard } from "@/components/configuracion/security-card";
import { Separator } from "@/components/ui/separator";
import type { ClinicSettings } from "@/lib/types/clinic-settings";
import { isAdmin, type Profile } from "@/lib/types/profile";

export function ConfiguracionView({
  profile,
  clinicSettings,
  clinicSettingsError,
}: {
  profile: Profile;
  clinicSettings: ClinicSettings | null;
  clinicSettingsError: string | null;
}) {
  const admin = isAdmin(profile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          {admin
            ? "Tu cuenta y los datos de la clínica"
            : "Tu cuenta y tus preferencias"}
        </p>
      </div>

      <section className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Mi cuenta
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileCard profile={profile} />
          <SecurityCard />
          <AppearanceCard />
          <NotificationsCard />
        </div>
      </section>

      {admin && (
        <section className="space-y-3">
          <Separator className="my-2" />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Empresa
          </p>
          {clinicSettings ? (
            <ClinicSettingsForm settings={clinicSettings} />
          ) : (
            <p className="text-sm text-destructive">
              No se pudo cargar la configuración de la clínica
              {clinicSettingsError ? `: ${clinicSettingsError}` : ""}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
