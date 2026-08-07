import { ClinicalRecordForm } from "@/components/fichas/clinical-record-form";
import { listPatients } from "@/lib/supabase/patient";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { listStaff } from "@/lib/supabase/staff";

export const dynamic = "force-dynamic";

export default async function NuevaFichaPage() {
  const [patients, staff, me] = await Promise.all([
    listPatients({ activeOnly: true }),
    listStaff({ activeOnly: true }),
    getCurrentProfile(),
  ]);

  const doctors = (staff.data ?? []).filter(
    (p) => p.role === "medico" || p.role === "administrador"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Nueva ficha clínica
        </h1>
      </div>
      <ClinicalRecordForm
        patients={patients.data ?? []}
        doctors={doctors}
        defaultDoctorId={me.profile?.id}
      />
    </div>
  );
}
