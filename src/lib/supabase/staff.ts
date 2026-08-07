import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";

type ListResult =
  | { data: Profile[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

export async function listStaff(opts?: {
  activeOnly?: boolean;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (opts?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: (data ?? []) as Profile[], error: null };
}

export async function updateStaffProfile(
  id: string,
  input: Partial<
    Pick<
      Profile,
      | "full_name"
      | "role"
      | "is_active"
      | "phone"
      | "specialty"
      | "document_type"
      | "document_number"
    >
  >
): Promise<
  | { data: Profile; error: null }
  | { data: null; error: "query_failed"; message?: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Profile, error: null };
}
