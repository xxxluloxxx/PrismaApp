import { createClient } from "@/lib/supabase/server";
import { getClinicSettings } from "@/lib/supabase/clinic-settings";
import type {
  Payment,
  PaymentInsert,
  PaymentMethod,
  PaymentWithContext,
} from "@/lib/types/quote";
import { PAYMENT_METHOD_LABELS } from "@/lib/types/quote";

const DEFAULT_CLINIC_TIMEZONE = "America/Guayaquil";

type ListResult =
  | { data: Payment[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type ListWithContextResult =
  | { data: PaymentWithContext[]; error: null }
  | { data: null; error: "query_failed"; message?: string };

type MutateResult =
  | { data: Payment; error: null }
  | { data: null; error: "query_failed"; message?: string };

export type DailyCashCut = {
  date: string;
  total: number;
  byMethod: Record<PaymentMethod, number>;
};

function mapPaymentWithContext(row: Record<string, unknown>): PaymentWithContext {
  const patient = row.patient as
    | { first_name?: string; last_name?: string }
    | null;
  const quote = row.quote as
    | {
        id?: string;
        doctor_id?: string;
        status?: string;
        total?: number;
        doctor?: { full_name?: string } | null;
      }
    | null;
  const doctor = quote?.doctor ?? null;

  return {
    id: String(row.id),
    quote_id: String(row.quote_id),
    patient_id: String(row.patient_id),
    paid_at: String(row.paid_at),
    amount: Number(row.amount),
    method: row.method as PaymentMethod,
    reference: (row.reference as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    received_by: (row.received_by as string | null) ?? null,
    created_at: String(row.created_at),
    patient_name: patient
      ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim()
      : "—",
    doctor_name: doctor?.full_name ?? "—",
    doctor_id: String(quote?.doctor_id ?? ""),
    quote_status: String(quote?.status ?? ""),
    quote_total: Number(quote?.total ?? 0),
  };
}

async function resolveClinicTimezone(): Promise<string> {
  try {
    const result = await getClinicSettings();
    const tz = result.data?.timezone?.trim();
    return tz || DEFAULT_CLINIC_TIMEZONE;
  } catch {
    return DEFAULT_CLINIC_TIMEZONE;
  }
}

function civilDatePartsInTimeZone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Offset of `timeZone` at `instant`: ms to add to UTC to get local wall time. */
function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUTC - instant.getTime();
}

/** UTC instant for civil Y-M-D 00:00:00 in `timeZone`. */
function zonedMidnightToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string
): Date {
  const localAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  const corrected = new Date(localAsUtc - offset);
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  return new Date(localAsUtc - offset2);
}

async function dayRange(
  isoDate?: string
): Promise<{ start: Date; end: Date; date: string }> {
  const timeZone = await resolveClinicTimezone();

  let year: number;
  let month: number;
  let day: number;

  if (isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    const parts = civilDatePartsInTimeZone(new Date(), timeZone);
    year = parts.year;
    month = parts.month;
    day = parts.day;
  }

  const start = zonedMidnightToUtc(year, month, day, timeZone);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const end = zonedMidnightToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    timeZone
  );
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { start, end, date };
}

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

export async function listPayments(filters?: {
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  doctorId?: string;
  method?: PaymentMethod;
}): Promise<ListWithContextResult> {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select(
      "*, patient:patients!patient_id(first_name,last_name), quote:quotes!inner(id, doctor_id, status, total, doctor:profiles!doctor_id(full_name))"
    )
    .order("paid_at", { ascending: false });

  if (filters?.dateFrom) query = query.gte("paid_at", filters.dateFrom);
  if (filters?.dateTo) {
    const { end } = await dayRange(filters.dateTo);
    query = query.lt("paid_at", end.toISOString());
  }
  if (filters?.patientId) query = query.eq("patient_id", filters.patientId);
  if (filters?.doctorId) query = query.eq("quote.doctor_id", filters.doctorId);
  if (filters?.method) query = query.eq("method", filters.method);

  const { data, error } = await query;
  if (error) {
    return { data: null, error: "query_failed", message: error.message };
  }

  return {
    data: (data ?? []).map((row) =>
      mapPaymentWithContext(row as Record<string, unknown>)
    ),
    error: null,
  };
}

export async function getDailyCashCut(
  date?: string
): Promise<DailyCashCut | null> {
  try {
    const { start, end, date: day } = await dayRange(date);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("amount, method")
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString());

    if (error) return null;

    const byMethod = Object.fromEntries(
      (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => [k, 0])
    ) as Record<PaymentMethod, number>;

    let total = 0;
    for (const row of data ?? []) {
      const amount = Number(row.amount ?? 0);
      total += amount;
      const method = row.method as PaymentMethod;
      if (method in byMethod) {
        byMethod[method] += amount;
      }
    }

    return { date: day, total, byMethod };
  } catch {
    return null;
  }
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
