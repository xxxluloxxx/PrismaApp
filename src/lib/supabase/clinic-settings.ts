import { createClient } from "@/lib/supabase/server";
import type {
  ClinicSettings,
  ClinicSettingsUpdate,
} from "@/lib/types/clinic-settings";

type OneResult =
  | { data: ClinicSettings; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: ClinicSettings; error: null }
  | { data: null; error: "query_failed"; message?: string };

export async function getClinicSettings(): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null, error: "not_found" };
    return { data: null, error: "query_failed", message: error.message };
  }

  return {
    data: {
      ...(data as ClinicSettings),
      tax_rate: Number(data.tax_rate),
    },
    error: null,
  };
}

export async function updateClinicSettings(
  input: ClinicSettingsUpdate
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_settings")
    .update(input)
    .eq("id", true)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  return {
    data: {
      ...(data as ClinicSettings),
      tax_rate: Number(data.tax_rate),
    },
    error: null,
  };
}
