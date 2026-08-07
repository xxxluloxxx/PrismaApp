"use server";

import { revalidatePath } from "next/cache";

import { createPayment } from "@/lib/supabase/payment";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getQuoteById } from "@/lib/supabase/quote";
import type { PaymentMethod } from "@/lib/types/quote";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createPaymentAction(input: {
  quote_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  if (!input.amount || input.amount <= 0) {
    return { ok: false, message: "El monto debe ser mayor a cero" };
  }

  const quote = await getQuoteById(input.quote_id);
  if (quote.error || !quote.data) {
    return { ok: false, message: "Presupuesto no encontrado" };
  }

  if (quote.data.status === "draft" || quote.data.status === "cancelled") {
    return {
      ok: false,
      message: "No se pueden registrar pagos sobre borradores o cancelados",
    };
  }

  const paid = quote.data.paid_amount ?? 0;
  const balance = Math.round((quote.data.total - paid) * 100) / 100;
  if (input.amount > balance + 0.001) {
    return {
      ok: false,
      message: `El pago excede el saldo (${balance.toFixed(2)})`,
    };
  }

  const result = await createPayment({
    quote_id: input.quote_id,
    patient_id: quote.data.patient_id,
    amount: input.amount,
    method: input.method,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    received_by: profile.profile.id,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo registrar el pago",
    };
  }

  revalidatePath(`/presupuestos/${input.quote_id}`);
  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  return { ok: true, id: result.data.id };
}
