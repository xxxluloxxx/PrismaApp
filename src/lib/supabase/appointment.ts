import { createClient } from "@/lib/supabase/server";
import type {
  Appointment,
  AppointmentInsert,
  AppointmentStatus,
  AppointmentUpdate,
  AppointmentWithRelations,
} from "@/lib/types/appointment";

type ListResult =
  | { data: AppointmentWithRelations[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type OneResult =
  | { data: AppointmentWithRelations; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: Appointment; error: null }
  | { data: null; error: "query_failed" | "conflict"; message?: string };

function mapRow(row: Record<string, unknown>): AppointmentWithRelations {
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

export async function listAppointments(opts?: {
  from?: string;
  to?: string;
  doctorId?: string;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .order("starts_at", { ascending: true });

  if (opts?.from) query = query.gte("starts_at", opts.from);
  if (opts?.to) query = query.lte("starts_at", opts.to);
  if (opts?.doctorId) query = query.eq("doctor_id", opts.doctorId);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return {
    data: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getAppointmentById(id: string): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null, error: "not_found" };
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: mapRow(data as Record<string, unknown>), error: null };
}

export async function createAppointment(
  input: AppointmentInsert
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    return {
      data: null,
      error: "query_failed",
      message: error.message,
    };
  }
  return { data: data as Appointment, error: null };
}

export async function updateAppointment(
  id: string,
  input: AppointmentUpdate,
  expectedUpdatedAt?: string
): Promise<MutateResult> {
  const supabase = await createClient();

  if (expectedUpdatedAt) {
    const { data: current, error: readError } = await supabase
      .from("appointments")
      .select("updated_at")
      .eq("id", id)
      .single();
    if (readError) {
      return { data: null, error: "query_failed", message: readError.message };
    }
    if (current?.updated_at !== expectedUpdatedAt) {
      return {
        data: null,
        error: "conflict",
        message: "La cita cambió en otro dispositivo. Recarga e inténtalo de nuevo.",
      };
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Appointment, error: null };
}
