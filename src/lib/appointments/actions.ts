"use server";

import { revalidatePath } from "next/cache";

import {
  createAppointment,
  updateAppointment,
} from "@/lib/supabase/appointment";
import { getCurrentProfile } from "@/lib/supabase/profile";
import type {
  AppointmentInsert,
  AppointmentStatus,
  AppointmentUpdate,
} from "@/lib/types/appointment";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createAppointmentAction(
  input: Omit<AppointmentInsert, "created_by">
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await createAppointment({
    ...input,
    created_by: profile.profile.id,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear la cita",
    };
  }

  revalidatePath("/agenda");
  return { ok: true, id: result.data.id };
}

export async function updateAppointmentAction(
  id: string,
  input: AppointmentUpdate,
  expectedUpdatedAt: string
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updateAppointment(id, input, expectedUpdatedAt);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar la cita",
    };
  }

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  return { ok: true, id: result.data.id };
}

export async function transitionAppointmentAction(
  id: string,
  status: AppointmentStatus,
  expectedUpdatedAt: string
): Promise<ActionResult> {
  return updateAppointmentAction(id, { status }, expectedUpdatedAt);
}
