export type ClinicalImageType =
  | "radiografia"
  | "foto_intraoral"
  | "foto_extraoral"
  | "escaneo"
  | "otro";

export type ClinicalRecord = {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  record_date: string;
  chief_complaint: string | null;
  antecedents: string | null;
  allergies: string | null;
  current_medications: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalRecordWithNames = ClinicalRecord & {
  patient_name: string;
  doctor_name: string;
};

export type ClinicalImage = {
  id: string;
  clinical_record_id: string;
  storage_path: string;
  image_type: ClinicalImageType;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url?: string | null;
};

export type ClinicalRecordInsert = {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string | null;
  record_date?: string;
  chief_complaint?: string | null;
  antecedents?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  observations?: string | null;
};

export const CLINICAL_IMAGE_TYPE_LABELS: Record<ClinicalImageType, string> = {
  radiografia: "Radiografía",
  foto_intraoral: "Foto intraoral",
  foto_extraoral: "Foto extraoral",
  escaneo: "Escaneo",
  otro: "Otro",
};
