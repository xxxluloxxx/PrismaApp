import { createClient } from "@/lib/supabase/server";
import type {
  ClinicalImage,
  ClinicalImageType,
  ClinicalRecord,
  ClinicalRecordInsert,
  ClinicalRecordWithNames,
} from "@/lib/types/clinical";

const BUCKET = "clinical-images";
const SIGNED_TTL = 60 * 60;

type ListResult =
  | { data: ClinicalRecordWithNames[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type OneResult =
  | { data: ClinicalRecordWithNames; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: ClinicalRecord; error: null }
  | { data: null; error: "query_failed"; message?: string };

function mapRecord(row: Record<string, unknown>): ClinicalRecordWithNames {
  const patient = row.patient as { first_name?: string; last_name?: string } | null;
  const doctor = row.doctor as { full_name?: string } | null;
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    doctor_id: String(row.doctor_id),
    appointment_id: (row.appointment_id as string | null) ?? null,
    record_date: String(row.record_date),
    chief_complaint: (row.chief_complaint as string | null) ?? null,
    antecedents: (row.antecedents as string | null) ?? null,
    allergies: (row.allergies as string | null) ?? null,
    current_medications: (row.current_medications as string | null) ?? null,
    diagnosis: (row.diagnosis as string | null) ?? null,
    treatment_plan: (row.treatment_plan as string | null) ?? null,
    observations: (row.observations as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    patient_name: patient
      ? `${patient.last_name ?? ""}, ${patient.first_name ?? ""}`.trim()
      : "—",
    doctor_name: doctor?.full_name ?? "—",
  };
}

export async function listClinicalRecords(opts?: {
  patientId?: string;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("clinical_records")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .order("record_date", { ascending: false });

  if (opts?.patientId) query = query.eq("patient_id", opts.patientId);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return {
    data: (data ?? []).map((row) => mapRecord(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getClinicalRecordById(id: string): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_records")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null, error: "not_found" };
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: mapRecord(data as Record<string, unknown>), error: null };
}

export async function createClinicalRecord(
  input: ClinicalRecordInsert
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_records")
    .insert(input)
    .select("*")
    .single();
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as ClinicalRecord, error: null };
}

export async function updateClinicalRecord(
  id: string,
  input: Partial<ClinicalRecordInsert>
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_records")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as ClinicalRecord, error: null };
}

export async function listClinicalImages(
  clinicalRecordId: string
): Promise<
  | { data: ClinicalImage[]; error: null }
  | { data: null; error: "query_failed"; message?: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_images")
    .select("*")
    .eq("clinical_record_id", clinicalRecordId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  const images = (data ?? []) as ClinicalImage[];
  const withUrls: ClinicalImage[] = [];
  for (const image of images) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(image.storage_path, SIGNED_TTL);
    withUrls.push({ ...image, signed_url: signed?.signedUrl ?? null });
  }
  return { data: withUrls, error: null };
}

export async function addClinicalImageMeta(input: {
  clinical_record_id: string;
  storage_path: string;
  image_type: ClinicalImageType;
  caption?: string | null;
  uploaded_by: string;
}): Promise<
  | { data: ClinicalImage; error: null }
  | { data: null; error: "query_failed"; message?: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_images")
    .insert(input)
    .select("*")
    .single();
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as ClinicalImage, error: null };
}
