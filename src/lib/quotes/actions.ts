"use server";

import { revalidatePath } from "next/cache";

import { getClinicSettings } from "@/lib/supabase/clinic-settings";
import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  createQuoteWithItems,
  updateQuoteStatus,
} from "@/lib/supabase/quote";
import type { QuoteItemInput, QuoteStatus } from "@/lib/types/quote";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createQuoteAction(input: {
  patient_id: string;
  doctor_id: string;
  issue_date?: string;
  notes?: string | null;
  items: QuoteItemInput[];
  publish?: boolean;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  if (!input.items.length) {
    return { ok: false, message: "Agrega al menos una línea" };
  }

  const settings = await getClinicSettings();
  const taxRate = settings.data?.tax_rate ?? 0.15;

  const subtotal =
    Math.round(
      input.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      ) * 100
    ) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const result = await createQuoteWithItems(
    {
      patient_id: input.patient_id,
      doctor_id: input.doctor_id,
      issue_date: input.issue_date,
      status: input.publish ? "pending" : "draft",
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: input.notes ?? null,
      created_by: profile.profile.id,
    },
    input.items
  );

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear el presupuesto",
    };
  }

  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  return { ok: true, id: result.data.id };
}

export async function updateQuoteStatusAction(
  id: string,
  status: Extract<QuoteStatus, "pending" | "cancelled">
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updateQuoteStatus(id, status);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar el estado",
    };
  }

  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, id: result.data.id };
}
