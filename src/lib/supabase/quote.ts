import { createClient } from "@/lib/supabase/server";
import type {
  Quote,
  QuoteInsert,
  QuoteItem,
  QuoteItemInput,
  QuoteStatus,
  QuoteWithNames,
} from "@/lib/types/quote";

type ListResult =
  | { data: QuoteWithNames[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type OneResult =
  | { data: QuoteWithNames; error: null }
  | { data: null; error: "not_found" | "query_failed"; message?: string };

type MutateResult =
  | { data: Quote; error: null }
  | { data: null; error: "query_failed"; message?: string };

function mapQuote(row: Record<string, unknown>): QuoteWithNames {
  const patient = row.patient as
    | { first_name?: string; last_name?: string }
    | null;
  const doctor = row.doctor as { full_name?: string } | null;
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    doctor_id: String(row.doctor_id),
    clinical_record_id: (row.clinical_record_id as string | null) ?? null,
    issue_date: String(row.issue_date),
    status: row.status as QuoteStatus,
    currency: String(row.currency ?? "USD"),
    subtotal: Number(row.subtotal),
    tax_rate: Number(row.tax_rate),
    tax_amount: Number(row.tax_amount),
    total: Number(row.total),
    notes: (row.notes as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    patient_name: patient
      ? `${patient.last_name ?? ""}, ${patient.first_name ?? ""}`.trim()
      : "—",
    doctor_name: doctor?.full_name ?? "—",
  };
}

export async function listQuotes(opts?: {
  patientId?: string;
  status?: QuoteStatus;
}): Promise<ListResult> {
  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.patientId) query = query.eq("patient_id", opts.patientId);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return {
    data: (data ?? []).map((row) => mapQuote(row as Record<string, unknown>)),
    error: null,
  };
}

export async function getQuoteById(id: string): Promise<OneResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), doctor:profiles!doctor_id(full_name)"
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { data: null, error: "not_found" };
    return { data: null, error: "query_failed", message: error.message };
  }

  const quote = mapQuote(data as Record<string, unknown>);

  const { data: items, error: itemsError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return { data: null, error: "query_failed", message: itemsError.message };
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("quote_id", id);

  const paid = (payments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return {
    data: {
      ...quote,
      items: (items ?? []).map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        line_total: Number(item.line_total),
      })) as QuoteItem[],
      paid_amount: paid,
    },
    error: null,
  };
}

export async function createQuoteWithItems(
  header: QuoteInsert,
  items: QuoteItemInput[]
): Promise<MutateResult> {
  if (items.length === 0) {
    return {
      data: null,
      error: "query_failed",
      message: "El presupuesto necesita al menos una línea",
    };
  }

  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      patient_id: header.patient_id,
      doctor_id: header.doctor_id,
      clinical_record_id: header.clinical_record_id ?? null,
      issue_date: header.issue_date ?? new Date().toISOString().slice(0, 10),
      status: header.status ?? "draft",
      currency: header.currency ?? "USD",
      subtotal: header.subtotal,
      tax_rate: header.tax_rate,
      tax_amount: header.tax_amount,
      total: header.total,
      notes: header.notes ?? null,
      created_by: header.created_by ?? null,
    })
    .select("*")
    .single();

  if (error || !quote) {
    return {
      data: null,
      error: "query_failed",
      message: error?.message ?? "No se pudo crear el presupuesto",
    };
  }

  const rows = items.map((item, index) => ({
    quote_id: quote.id,
    treatment_id: item.treatment_id ?? null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: Math.round(item.quantity * item.unit_price * 100) / 100,
    sort_order: item.sort_order ?? index,
  }));

  const { error: itemsError } = await supabase.from("quote_items").insert(rows);
  if (itemsError) {
    await supabase.from("quotes").delete().eq("id", quote.id);
    return {
      data: null,
      error: "query_failed",
      message: itemsError.message,
    };
  }

  return { data: quote as Quote, error: null };
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<MutateResult> {
  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", id)
    .single();

  if (readError) {
    return { data: null, error: "query_failed", message: readError.message };
  }

  const from = current.status as QuoteStatus;
  if (from === "cancelled" || from === "paid") {
    return {
      data: null,
      error: "query_failed",
      message: "No se puede cambiar el estado de un presupuesto cerrado",
    };
  }

  if (status === "pending" && from !== "draft") {
    return {
      data: null,
      error: "query_failed",
      message: "Solo un borrador puede pasar a pendiente",
    };
  }

  if (status === "cancelled" && !["draft", "pending"].includes(from)) {
    return {
      data: null,
      error: "query_failed",
      message: "Solo borradores o pendientes se pueden cancelar",
    };
  }

  if (status !== "pending" && status !== "cancelled") {
    return {
      data: null,
      error: "query_failed",
      message: "Transición de estado no permitida desde la UI",
    };
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }
  return { data: data as Quote, error: null };
}

export async function countQuotesByStatus(
  status: QuoteStatus
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) return 0;
  return count ?? 0;
}
