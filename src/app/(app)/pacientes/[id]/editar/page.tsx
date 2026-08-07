import { notFound } from "next/navigation";

import { PatientForm } from "@/components/pacientes/patient-form";
import { getPatientById } from "@/lib/supabase/patient";

export const dynamic = "force-dynamic";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPatientById(id);
  if (result.error || !result.data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Editar paciente
        </h1>
        <p className="text-sm text-muted-foreground">
          {result.data.first_name} {result.data.last_name}
        </p>
      </div>
      <PatientForm patient={result.data} />
    </div>
  );
}
