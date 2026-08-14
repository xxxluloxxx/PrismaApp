"use server";

import { revalidatePath } from "next/cache";

import { sendPushToProfiles } from "@/lib/push/send";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/supabase/clinic-timezone";
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

  try {
    const appointmentDate = result.data.starts_at
      ? new Date(result.data.starts_at).toLocaleString("es-EC", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: DEFAULT_CLINIC_TIMEZONE,
        })
      : null;

    // Se espera el envío para que serverless no termine antes de completarlo.
    await sendPushToProfiles([input.doctor_id], {
      title: "Nueva cita agendada",
      body: appointmentDate
        ? `Nueva cita para ${appointmentDate}`
        : "Se ha agendado una nueva cita",
      url: `/agenda/${result.data.id}`,
    });
  } catch (error) {
    console.error(
      "Falló el push de nueva cita:",
      error instanceof Error ? error.message : error
    );
  }

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
