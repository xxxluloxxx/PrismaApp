"use server";

import { revalidatePath } from "next/cache";

import {
  updateOdontogramNotes,
  upsertToothCondition,
} from "@/lib/supabase/odontogram";
import { getCurrentProfile } from "@/lib/supabase/profile";
import type { ToothCondition, ToothSurface } from "@/lib/types/odontogram";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function upsertToothConditionAction(input: {
  odontogram_id: string;
  tooth_code: string;
  condition: ToothCondition;
  surface: ToothSurface;
  notes?: string | null;
  clinical_record_id?: string;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await upsertToothCondition(input);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo guardar la pieza",
    };
  }

  if (input.clinical_record_id) {
    revalidatePath(`/fichas/${input.clinical_record_id}`);
  }
  return { ok: true, id: result.data.id };
}

export async function updateOdontogramNotesAction(input: {
  id: string;
  notes: string | null;
  clinical_record_id?: string;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updateOdontogramNotes(input.id, input.notes);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudieron guardar las notas",
    };
  }

  if (input.clinical_record_id) {
    revalidatePath(`/fichas/${input.clinical_record_id}`);
  }
  return { ok: true, id: result.data.id };
}
