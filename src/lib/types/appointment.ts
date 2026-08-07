export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithRelations = Appointment & {
  patient_name: string;
  doctor_name: string;
};

export type AppointmentInsert = {
  patient_id: string;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
  status?: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  created_by: string;
};

export type AppointmentUpdate = Partial<
  Omit<AppointmentInsert, "created_by">
>;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
