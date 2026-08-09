import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "@/lib/types/profile";

export type OwnProfilePatch = {
  full_name: string;
  phone: string | null;
};

type UpdateOwnProfileResult =
  | { profile: Profile; error: null }
  | { profile: null; error: "unauthenticated" | "query_failed"; message?: string };

/**
 * Actualiza el propio nombre/teléfono del usuario autenticado (médico o
 * administrador editando SU PROPIA fila desde "Mi cuenta").
 * Client-safe: recibe el supabase client (no importa next/headers).
 * Se apoya en la policy "profiles_update_own_safe_fields" (0001_profiles.sql):
 * el usuario solo puede editar su propia fila, y esa policy permite
 * full_name/phone sin restricción -- solo bloquea role/is_active.
 */
export async function updateOwnProfile(
  supabase: SupabaseClient,
  patch: OwnProfilePatch
): Promise<UpdateOwnProfileResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: patch.full_name,
      phone: patch.phone,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return {
      profile: null,
      error: "query_failed",
      message:
        error.code === "42501"
          ? "No tienes permiso para esta acción"
          : error.message,
    };
  }
  if (!data) {
    return { profile: null, error: "query_failed" };
  }

  return { profile: data as Profile, error: null };
}
