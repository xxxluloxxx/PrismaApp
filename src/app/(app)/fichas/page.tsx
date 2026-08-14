import { ClinicalRecordsList } from "@/components/fichas/clinical-records-list";
import { listClinicalRecords } from "@/lib/supabase/clinical";

export const dynamic = "force-dynamic";

export default async function FichasPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const params = await searchParams;
  const result = await listClinicalRecords({ patientId: params.patient });
  return (
    <>
      <ClinicalRecordsList
        records={result.data ?? []}
        patientId={params.patient}
      />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudieron cargar las fichas
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0006?"}
        </p>
      ) : null}
    </>
  );
}
