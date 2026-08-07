"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { updateStaffProfile } from "@/lib/supabase/staff";
import type { Profile, UserRole } from "@/lib/types/profile";
import { isAdmin } from "@/lib/types/profile";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateStaffAction(
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
): Promise<ActionResult> {
  const me = await getCurrentProfile();
  if (me.error || !me.profile || !isAdmin(me.profile)) {
    return { ok: false, message: "Solo el administrador puede gestionar el equipo" };
  }

  if (input.role && input.role !== "administrador" && input.role !== "medico") {
    return { ok: false, message: "Rol inválido" };
  }

  const result = await updateStaffProfile(id, input as {
    role?: UserRole;
    full_name?: string;
    is_active?: boolean;
    phone?: string | null;
    specialty?: string | null;
    document_type?: string | null;
    document_number?: string | null;
  });

  if (result.error) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar el miembro",
    };
  }

  revalidatePath("/equipo");
  return { ok: true };
}
