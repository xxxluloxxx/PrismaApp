import { StaffAdmin } from "@/components/equipo/staff-admin";
import { listStaff } from "@/lib/supabase/staff";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const result = await listStaff();
  return (
    <>
      <StaffAdmin staff={result.data ?? []} />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudo cargar el equipo
          {result.message ? `: ${result.message}` : ""}
        </p>
      ) : null}
    </>
  );
}
