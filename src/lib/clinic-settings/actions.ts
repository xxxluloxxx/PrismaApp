"use server";

import { revalidatePath } from "next/cache";

import { updateClinicSettings } from "@/lib/supabase/clinic-settings";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function updateClinicSettingsAction(input: {
  clinic_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_rate: number;
  timezone: string;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }
  if (!isAdmin(profile.profile)) {
    return { ok: false, message: "Solo administradores pueden editar la configuración" };
  }

  if (!input.clinic_name.trim()) {
    return { ok: false, message: "El nombre de la clínica es obligatorio" };
  }

  if (input.tax_rate < 0 || input.tax_rate > 1) {
    return { ok: false, message: "La tasa de IVA debe estar entre 0 y 1" };
  }

  const result = await updateClinicSettings({
    clinic_name: input.clinic_name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    tax_rate: input.tax_rate,
    timezone: input.timezone.trim() || "America/Guayaquil",
    updated_by: profile.profile.id,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo guardar la configuración",
    };
  }

  revalidatePath("/configuracion");
  revalidatePath("/presupuestos/nuevo");
  return { ok: true, id: "clinic" };
}
