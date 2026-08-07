import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/profile";

export type ProfileResult =
  | { profile: Profile; error: null }
  | { profile: null; error: "unauthenticated" | "not_found" | "query_failed" };

export async function getCurrentProfile(): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { profile: null, error: "not_found" };
    }
    return { profile: null, error: "query_failed" };
  }

  if (!data) {
    return { profile: null, error: "not_found" };
  }

  return { profile: data as Profile, error: null };
}
