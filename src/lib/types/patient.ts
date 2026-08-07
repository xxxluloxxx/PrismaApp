export type PatientSex = "M" | "F" | "O" | "U";

export type Patient = {
  id: string;
  document_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  sex: PatientSex | null;
  phone: string;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientInsert = {
  document_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  sex?: PatientSex | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
  created_by: string;
};

export type PatientUpdate = Partial<Omit<PatientInsert, "created_by">> & {
  is_active?: boolean;
};

export const SEX_LABELS: Record<PatientSex, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
  U: "No especificado",
};
