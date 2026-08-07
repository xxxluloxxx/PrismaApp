import { QuoteForm } from "@/components/presupuestos/quote-form";
import { getClinicSettings } from "@/lib/supabase/clinic-settings";
import { listPatients } from "@/lib/supabase/patient";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { listStaff } from "@/lib/supabase/staff";
import { listTreatments } from "@/lib/supabase/treatment";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const params = await searchParams;
  const [patients, staff, treatments, settings, me] = await Promise.all([
    listPatients({ activeOnly: true }),
    listStaff({ activeOnly: true }),
    listTreatments({ activeOnly: true }),
    getClinicSettings(),
    getCurrentProfile(),
  ]);

  const doctors = (staff.data ?? []).filter(
    (p) => p.role === "medico" || p.role === "administrador"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Nuevo presupuesto
        </h1>
        <p className="text-sm text-muted-foreground">
          IVA actual:{" "}
          {((settings.data?.tax_rate ?? 0.15) * 100).toFixed(0)}% (snapshot al
          guardar)
        </p>
      </div>
      <QuoteForm
        patients={patients.data ?? []}
        doctors={doctors}
        treatments={treatments.data ?? []}
        taxRate={settings.data?.tax_rate ?? 0.15}
        defaultDoctorId={me.profile?.id}
        defaultPatientId={params.patient}
      />
    </div>
  );
}
