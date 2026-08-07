"use server";

import { revalidatePath } from "next/cache";

import {
  createOdontogram,
  updateOdontogramNotes,
  upsertToothCondition,
} from "@/lib/supabase/odontogram";
import { getCurrentProfile } from "@/lib/supabase/profile";
import type { ToothCondition } from "@/lib/types/odontogram";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createOdontogramAction(input: {
  patient_id: string;
  clinical_record_id?: string | null;
  notes?: string | null;
  clone_last?: boolean;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await createOdontogram(
    {
      patient_id: input.patient_id,
      clinical_record_id: input.clinical_record_id ?? null,
      notes: input.notes ?? null,
      created_by: profile.profile.id,
      chart_type: "adulto",
    },
    { cloneLast: Boolean(input.clone_last) }
  );

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear el odontograma",
    };
  }

  revalidatePath("/odontograma");
  revalidatePath(`/pacientes/${input.patient_id}`);
  return { ok: true, id: result.data.id };
}

export async function upsertToothConditionAction(input: {
  odontogram_id: string;
  tooth_code: string;
  condition: ToothCondition;
  notes?: string | null;
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

  revalidatePath(`/odontograma/${input.odontogram_id}`);
  return { ok: true, id: result.data.id };
}

export async function updateOdontogramNotesAction(
  id: string,
  notes: string | null
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updateOdontogramNotes(id, notes);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudieron guardar las notas",
    };
  }

  revalidatePath(`/odontograma/${id}`);
  return { ok: true, id: result.data.id };
}
