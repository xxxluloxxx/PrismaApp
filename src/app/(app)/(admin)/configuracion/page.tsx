import { ClinicSettingsForm } from "@/components/configuracion/clinic-settings-form";
import { getClinicSettings } from "@/lib/supabase/clinic-settings";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const result = await getClinicSettings();

  if (result.error || !result.data) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-destructive">
          No se pudo cargar la configuración de la clínica
          {result.message ? `: ${result.message}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos de la clínica e IVA para nuevos presupuestos
        </p>
      </div>
      <ClinicSettingsForm settings={result.data} />
    </div>
  );
}
