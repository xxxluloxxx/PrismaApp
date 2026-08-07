import { createClient } from "@/lib/supabase/server";
import type {
  Treatment,
  TreatmentInsert,
  TreatmentUpdate,
} from "@/lib/types/treatment";

type ListResult =
  | { data: Treatment[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type MutateResult =
  | { data: Treatment; error: null }
  | { data: null; error: "query_failed" | "conflict"; message?: string };

export async function listTreatments(opts?: {
  activeOnly?: boolean;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("treatments")
    .select("*")
    .order("name", { ascending: true });

  if (opts?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: (data ?? []) as Treatment[], error: null };
}

export async function createTreatment(
  input: TreatmentInsert
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatments")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: "conflict",
        message: "Ya existe un tratamiento con ese código",
      };
    }
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Treatment, error: null };
}

export async function updateTreatment(
  id: string,
  input: TreatmentUpdate
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatments")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: "conflict",
        message: "Ya existe un tratamiento con ese código",
      };
    }
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Treatment, error: null };
}
