"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  createTreatment,
  updateTreatment,
} from "@/lib/supabase/treatment";
import { isAdmin } from "@/lib/types/profile";
import type { TreatmentInsert, TreatmentUpdate } from "@/lib/types/treatment";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

async function requireAdmin() {
  const result = await getCurrentProfile();
  if (result.error || !result.profile || !isAdmin(result.profile)) {
    return null;
  }
  return result.profile;
}

export async function createTreatmentAction(
  input: TreatmentInsert
): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Solo el administrador puede crear tratamientos" };
  }
  const result = await createTreatment(input);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear el tratamiento",
    };
  }
  revalidatePath("/tratamientos");
  return { ok: true, id: result.data.id };
}

export async function updateTreatmentAction(
  id: string,
  input: TreatmentUpdate
): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Solo el administrador puede editar tratamientos" };
  }
  const result = await updateTreatment(id, input);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar el tratamiento",
    };
  }
  revalidatePath("/tratamientos");
  return { ok: true, id: result.data.id };
}
