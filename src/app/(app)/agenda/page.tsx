import { AppointmentsAgenda } from "@/components/agenda/appointments-agenda";
import { listAppointments } from "@/lib/supabase/appointment";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 30);

  const result = await listAppointments({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  return (
    <>
      <AppointmentsAgenda appointments={result.data ?? []} />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudo cargar la agenda
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0005?"}
        </p>
      ) : null}
    </>
  );
}
