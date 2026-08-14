import { createClient } from "@/lib/supabase/server";
import type {
  Odontogram,
  OdontogramTooth,
  OdontogramWithNames,
  ToothCondition,
  ToothSurface,
} from "@/lib/types/odontogram";

type ListResult =
  | { data: OdontogramWithNames[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type OneResult =
  | { data: OdontogramWithNames; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: Odontogram; error: null }
  | { data: null; error: "query_failed"; message?: string };

function mapRow(row: Record<string, unknown>): OdontogramWithNames {
  const patient = row.patient as
    | { first_name?: string; last_name?: string }
    | null;
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    clinical_record_id: (row.clinical_record_id as string | null) ?? null,
    chart_type: (row.chart_type as Odontogram["chart_type"]) ?? "adulto",
    notes: (row.notes as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    patient_name: patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
      : "—",
  };
}

export async function listOdontograms(opts?: {
  patientId?: string;
  limit?: number;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("odontograms")
    .select("*, patient:patients!patient_id(first_name,last_name)")
    .order("created_at", { ascending: false });

  if (opts?.patientId) query = query.eq("patient_id", opts.patientId);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return {
    data: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getOdontogramById(id: string): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("odontograms")
    .select("*, patient:patients!patient_id(first_name,last_name)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null, error: "not_found" };
    return { data: null, error: "query_failed", message: error.message };
  }

  const chart = mapRow(data as Record<string, unknown>);
  const { data: teeth, error: teethError } = await supabase
    .from("odontogram_teeth")
    .select("*")
    .eq("odontogram_id", id);

  if (teethError) {
    return { data: null, error: "query_failed", message: teethError.message };
  }

  return {
    data: { ...chart, teeth: (teeth ?? []) as OdontogramTooth[] },
    error: null,
  };
}

export async function getOdontogramByClinicalRecordId(
  clinicalRecordId: string
): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("odontograms")
    .select("*, patient:patients!patient_id(first_name,last_name)")
    .eq("clinical_record_id", clinicalRecordId)
    .maybeSingle();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  if (!data) {
    return { data: null, error: "not_found" };
  }

  const chart = mapRow(data as Record<string, unknown>);
  const { data: teeth, error: teethError } = await supabase
    .from("odontogram_teeth")
    .select("*")
    .eq("odontogram_id", chart.id);

  if (teethError) {
    return { data: null, error: "query_failed", message: teethError.message };
  }

  return {
    data: { ...chart, teeth: (teeth ?? []) as OdontogramTooth[] },
    error: null,
  };
}

export async function upsertToothCondition(input: {
  odontogram_id: string;
  tooth_code: string;
  condition: ToothCondition;
  surface: ToothSurface;
  notes?: string | null;
}): Promise<
  | { data: OdontogramTooth; error: null }
  | { data: null; error: "query_failed"; message?: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("odontogram_teeth")
    .upsert(
      {
        odontogram_id: input.odontogram_id,
        tooth_code: input.tooth_code,
        condition: input.condition,
        surface: input.surface,
        notes: input.notes ?? null,
      },
      { onConflict: "odontogram_id,tooth_code,surface" }
    )
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as OdontogramTooth, error: null };
}

export async function updateOdontogramNotes(
  id: string,
  notes: string | null
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("odontograms")
    .update({ notes })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Odontogram, error: null };
}
