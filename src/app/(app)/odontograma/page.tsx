import { OdontogramsHome } from "@/components/odontograma/odontograms-home";
import { listOdontograms } from "@/lib/supabase/odontogram";
import { listPatients } from "@/lib/supabase/patient";

export const dynamic = "force-dynamic";

export default async function OdontogramaPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const params = await searchParams;
  const [patients, recent] = await Promise.all([
    listPatients({ activeOnly: true }),
    listOdontograms({ limit: 30 }),
  ]);

  return (
    <>
      <OdontogramsHome
        patients={patients.data ?? []}
        recent={recent.data ?? []}
        defaultPatientId={params.patient}
      />
      {recent.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudieron cargar odontogramas
          {recent.message ? `: ${recent.message}` : ". ¿Aplicaste la migración 0007?"}
        </p>
      ) : null}
    </>
  );
}
