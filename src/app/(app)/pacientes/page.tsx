import { Suspense } from "react";

import { PatientsList } from "@/components/pacientes/patients-list";
import { listPatients } from "@/lib/supabase/patient";

export const dynamic = "force-dynamic";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; all?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const showInactive = params.all === "1";

  const result = await listPatients({
    search: search || null,
    activeOnly: !showInactive,
  });

  const patients = result.data ?? [];

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
      <PatientsList
        patients={patients}
        initialSearch={search}
        showInactive={showInactive}
      />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudo cargar la lista
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0003?"}
        </p>
      ) : null}
    </Suspense>
  );
}
