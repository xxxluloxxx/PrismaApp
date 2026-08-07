import { ClinicalRecordsList } from "@/components/fichas/clinical-records-list";
import { listClinicalRecords } from "@/lib/supabase/clinical";

export const dynamic = "force-dynamic";

export default async function FichasPage() {
  const result = await listClinicalRecords();
  return (
    <>
      <ClinicalRecordsList records={result.data ?? []} />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudieron cargar las fichas
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0006?"}
        </p>
      ) : null}
    </>
  );
}
