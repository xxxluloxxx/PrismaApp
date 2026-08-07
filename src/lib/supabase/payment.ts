import { createClient } from "@/lib/supabase/server";
import type { Payment, PaymentInsert } from "@/lib/types/quote";

type ListResult =
  | { data: Payment[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type MutateResult =
  | { data: Payment; error: null }
  | { data: null; error: "query_failed"; message?: string };

export async function listPaymentsByQuote(
  quoteId: string
): Promise<ListResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("quote_id", quoteId)
    .order("paid_at", { ascending: false });

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  return {
    data: (data ?? []).map((p) => ({
      ...p,
      amount: Number(p.amount),
    })) as Payment[],
    error: null,
  };
}

export async function createPayment(
  input: PaymentInsert
): Promise<MutateResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      quote_id: input.quote_id,
      patient_id: input.patient_id,
      amount: input.amount,
      method: input.method,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      received_by: input.received_by ?? null,
      paid_at: input.paid_at ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  return {
    data: { ...data, amount: Number(data.amount) } as Payment,
    error: null,
  };
}

export async function sumPaymentsForQuote(quoteId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("quote_id", quoteId);

  if (error || !data) return 0;
  return data.reduce((sum, p) => sum + Number(p.amount), 0);
}
