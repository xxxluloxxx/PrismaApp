import { AppointmentForm } from "@/components/agenda/appointment-form";
import { listPatients } from "@/lib/supabase/patient";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { listStaff } from "@/lib/supabase/staff";

export const dynamic = "force-dynamic";

export default async function NuevaCitaPage() {
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
          Agendar cita
        </h1>
        <p className="text-sm text-muted-foreground">
          El sistema evita solapes del mismo médico
        </p>
      </div>
      <AppointmentForm
        patients={patients.data ?? []}
        doctors={doctors}
        defaultDoctorId={
          me.profile?.role === "medico" ? me.profile.id : undefined
        }
      />
    </div>
  );
}
