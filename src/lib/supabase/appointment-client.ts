import { createClient } from "@/lib/supabase/client";
import {
  APPOINTMENT_LIST_SELECT,
  mapAppointmentRow,
} from "@/lib/supabase/appointment-shared";
import type { AppointmentWithRelations } from "@/lib/types/appointment";

type ListResult =
  | { data: AppointmentWithRelations[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

/**
 * Variante client-side de `listAppointments` (ver `@/lib/supabase/appointment`).
 * Se usa para cargar el mes visible de la vista calendario sin recargar la página.
 * Respeta RLS igual que la versión de servidor (misma sesión, distinto transporte de cookies).
 */
export async function listAppointmentsClient(opts: {
  from: string;
  to: string;
  doctorId?: string;
}): Promise<ListResult> {
  const supabase = createClient();
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_LIST_SELECT)
    .order("starts_at", { ascending: true })
    .gte("starts_at", opts.from)
    .lte("starts_at", opts.to);

  if (opts.doctorId) query = query.eq("doctor_id", opts.doctorId);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return {
    data: (data ?? []).map((row) => mapAppointmentRow(row as Record<string, unknown>)),
    error: null,
  };
}
