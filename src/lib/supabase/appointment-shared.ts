import type { AppointmentStatus, AppointmentWithRelations } from "@/lib/types/appointment";

/** Select reutilizado por las variantes server y client de listAppointments. */
export const APPOINTMENT_LIST_SELECT =
  "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)";

/** Mapeo de fila cruda de Supabase a `AppointmentWithRelations`. Sin dependencias de server/client. */
export function mapAppointmentRow(
  row: Record<string, unknown>
): AppointmentWithRelations {
  const patient = row.patient as { first_name?: string; last_name?: string } | null;
  const doctor = row.doctor as { full_name?: string } | null;
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    doctor_id: String(row.doctor_id),
    starts_at: String(row.starts_at),
    ends_at: String(row.ends_at),
    status: row.status as AppointmentStatus,
    reason: (row.reason as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    patient_name: patient
      ? `${patient.last_name ?? ""}, ${patient.first_name ?? ""}`.trim()
      : "—",
    doctor_name: doctor?.full_name ?? "—",
  };
}
