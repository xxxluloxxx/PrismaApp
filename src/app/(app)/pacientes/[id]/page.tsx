import { notFound } from "next/navigation";

import { PatientDetail } from "@/components/pacientes/patient-detail";
import { getPatientById } from "@/lib/supabase/patient";

export const dynamic = "force-dynamic";

export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPatientById(id);
  if (result.error || !result.data) notFound();
  return <PatientDetail patient={result.data} />;
}
