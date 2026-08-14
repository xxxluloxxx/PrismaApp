export type BookingDoctor = {
  id: string;
  full_name: string;
  specialty: string | null;
};

export type BookingTreatment = {
  id: string;
  name: string;
  duration_minutes: number;
};

export type BookingOptions = {
  doctors: BookingDoctor[];
  treatments: BookingTreatment[];
  business_hours: Record<string, unknown>;
  timezone: string;
  default_duration_minutes: number;
};

export type ApiSlot = {
  starts_at: string;
  ends_at: string;
};

export type BookingSlot = ApiSlot & {
  doctor_id: string;
};

export type ContactDetails = {
  document_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
};

export type ConfirmedBooking = {
  appointment_id: string;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
  doctor_name: string;
  treatment_name: string | null;
};
