"use server";

import { revalidatePath } from "next/cache";

import {
  createPatient,
  setPatientActive,
  updatePatient,
} from "@/lib/supabase/patient";
import { getCurrentProfile } from "@/lib/supabase/profile";
import type { PatientInsert, PatientUpdate } from "@/lib/types/patient";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createPatientAction(
  input: Omit<PatientInsert, "created_by">
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await createPatient({
    ...input,
    created_by: profile.profile.id,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear el paciente",
    };
  }

  revalidatePath("/pacientes");
  return { ok: true, id: result.data.id };
}

export async function updatePatientAction(
  id: string,
  input: PatientUpdate,
  expectedUpdatedAt: string
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updatePatient(id, input, expectedUpdatedAt);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar el paciente",
    };
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  return { ok: true, id: result.data.id };
}

export async function setPatientActiveAction(
  id: string,
  isActive: boolean,
  expectedUpdatedAt: string
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await setPatientActive(id, isActive, expectedUpdatedAt);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo cambiar el estado",
    };
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  return { ok: true, id: result.data.id };
}
