import { createClient } from "@/lib/supabase/server";
import type {
  Patient,
  PatientInsert,
  PatientUpdate,
} from "@/lib/types/patient";

export type PatientFilters = {
  search?: string | null;
  activeOnly?: boolean;
};

type ListResult =
  | { data: Patient[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type OneResult =
  | { data: Patient; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: Patient; error: null }
  | { data: null; error: "query_failed" | "conflict"; message?: string };

export async function listPatients(
  filters: PatientFilters = {}
): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (filters.activeOnly !== false) {
    query = query.eq("is_active", true);
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `document_id.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},phone.ilike.${pattern}`
    );
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: (data ?? []) as Patient[], error: null };
}

export async function getPatientById(id: string): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: "not_found" };
    }
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Patient, error: null };
}

export async function createPatient(
  input: PatientInsert
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: "conflict",
        message: "Ya existe un paciente con esa identificación",
      };
    }
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Patient, error: null };
}

export async function updatePatient(
  id: string,
  input: PatientUpdate,
  expectedUpdatedAt?: string
): Promise<MutateResult> {
  const supabase = await createClient();

  if (expectedUpdatedAt) {
    const { data: current, error: readError } = await supabase
      .from("patients")
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
        message: "El paciente fue modificado por otro usuario. Recarga e inténtalo de nuevo.",
      };
    }
  }

  const { data, error } = await supabase
    .from("patients")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: "conflict",
        message: "Ya existe un paciente con esa identificación",
      };
    }
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Patient, error: null };
}

export async function setPatientActive(
  id: string,
  isActive: boolean,
  expectedUpdatedAt?: string
): Promise<MutateResult> {
  return updatePatient(id, { is_active: isActive }, expectedUpdatedAt);
}
