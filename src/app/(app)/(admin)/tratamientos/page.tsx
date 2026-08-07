import { TreatmentsAdmin } from "@/components/tratamientos/treatments-admin";
import { listTreatments } from "@/lib/supabase/treatment";

export const dynamic = "force-dynamic";

export default async function TratamientosPage() {
  const result = await listTreatments();
  return (
    <>
      <TreatmentsAdmin treatments={result.data ?? []} />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudo cargar el catálogo
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0004?"}
        </p>
      ) : null}
    </>
  );
}
