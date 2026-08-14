import { createClient } from "@/lib/supabase/server";
import {
  civilDatePartsInTimeZone,
  resolveClinicTimezone,
  zonedMidnightToUtc,
} from "@/lib/supabase/clinic-timezone";

// =============================================================================
// Insights administrativos del dashboard (solo administrador).
// Las consultas confían en las policies RLS ya existentes: `payments` y
// `quote_items` son legibles por staff activo. No se relaja ninguna policy
// aquí; simplemente se leen y agregan datos en JS.
// =============================================================================

export type MonthlyRevenue = {
  currentMonthTotal: number;
  previousMonthTotal: number;
  /** Variación porcentual vs. mes anterior, null si no hay base de comparación. */
  changePct: number | null;
};

export type TopTreatment = {
  key: string;
  name: string;
  count: number;
  revenue: number;
};

export type RevenueTrendPoint = {
  month: string; // "2026-08"
  label: string; // "ago"
  total: number;
};

export type QuoteStatusSummary = {
  status: "draft" | "pending" | "partially_paid" | "paid" | "cancelled";
  count: number;
  total: number;
};

const QUOTE_STATUSES: QuoteStatusSummary["status"][] = [
  "draft",
  "pending",
  "partially_paid",
  "paid",
  "cancelled",
];

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Inicio/fin del mes civil `monthsAgo` atrás, en la timezone de la clínica. */
function monthRange(
  monthsAgo: number,
  timeZone: string
): { start: Date; end: Date } {
  const now = civilDatePartsInTimeZone(new Date(), timeZone);
  const startAnchor = new Date(Date.UTC(now.year, now.month - 1 - monthsAgo, 1));
  const endAnchor = new Date(Date.UTC(now.year, now.month - monthsAgo, 1));
  const start = zonedMidnightToUtc(
    startAnchor.getUTCFullYear(),
    startAnchor.getUTCMonth() + 1,
    1,
    timeZone
  );
  const end = zonedMidnightToUtc(
    endAnchor.getUTCFullYear(),
    endAnchor.getUTCMonth() + 1,
    1,
    timeZone
  );
  return { start, end };
}

/** Interpreta "YYYY-MM-DD" como fecha civil (año/mes/día). */
function parseDateOnlyParts(isoDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

/**
 * Fin de día inclusivo para filtros `.lte` sobre timestamptz.
 * Si ya trae hora (incluye "T"), se usa tal cual; si es solo fecha, se ancla al
 * último milisegundo del día civil en la timezone de la clínica.
 */
function inclusiveEndIso(isoDate: string, timeZone: string): string {
  if (isoDate.includes("T")) return isoDate;
  const { year, month, day } = parseDateOnlyParts(isoDate);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextMidnight = zonedMidnightToUtc(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    timeZone
  );
  return new Date(nextMidnight.getTime() - 1).toISOString();
}

/** Medianoche del día civil `YYYY-MM-DD` en la timezone de la clínica (ISO UTC). */
function rangeStartIso(isoDate: string, timeZone: string): string {
  const { year, month, day } = parseDateOnlyParts(isoDate);
  return zonedMidnightToUtc(year, month, day, timeZone).toISOString();
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue | null> {
  try {
    const supabase = await createClient();
    const timeZone = await resolveClinicTimezone();
    const current = monthRange(0, timeZone);
    const previous = monthRange(1, timeZone);

    const [currentRes, previousRes] = await Promise.all([
      supabase
        .from("payments")
        .select("amount")
        .gte("paid_at", current.start.toISOString())
        .lt("paid_at", current.end.toISOString()),
      supabase
        .from("payments")
        .select("amount")
        .gte("paid_at", previous.start.toISOString())
        .lt("paid_at", previous.end.toISOString()),
    ]);

    if (currentRes.error || previousRes.error) return null;

    const currentMonthTotal = (currentRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    );
    const previousMonthTotal = (previousRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    );

    const changePct =
      previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : null;

    return { currentMonthTotal, previousMonthTotal, changePct };
  } catch {
    return null;
  }
}

export async function getQuoteStatusPortfolio(
  range?: { from?: string; to?: string }
): Promise<QuoteStatusSummary[] | null> {
  try {
    const supabase = await createClient();
    const timeZone = await resolveClinicTimezone();
    let query = supabase.from("quotes").select("status, total");

    if (range?.from) {
      query = query.gte("created_at", rangeStartIso(range.from, timeZone));
    }
    if (range?.to) {
      // Fin de día inclusivo para que el filtro cubra todo el día `to`.
      query = query.lte("created_at", inclusiveEndIso(range.to, timeZone));
    }

    const { data, error } = await query;
    if (error) return null;

    const byStatus = new Map<
      QuoteStatusSummary["status"],
      { count: number; total: number }
    >();
    for (const status of QUOTE_STATUSES) {
      byStatus.set(status, { count: 0, total: 0 });
    }

    for (const row of data ?? []) {
      const status = row.status as QuoteStatusSummary["status"];
      const entry = byStatus.get(status);
      if (!entry) continue;
      entry.count += 1;
      entry.total += Number(row.total ?? 0);
    }

    return QUOTE_STATUSES.map((status) => ({
      status,
      count: byStatus.get(status)!.count,
      total: byStatus.get(status)!.total,
    }));
  } catch {
    return null;
  }
}

export async function getTopTreatments(
  limit = 10,
  range?: { from?: string; to?: string }
): Promise<TopTreatment[] | null> {
  try {
    const supabase = await createClient();
    const timeZone = await resolveClinicTimezone();
    const hasRange = Boolean(range?.from || range?.to);

    // Sin rango: query plana (sin join). Con rango: inner join a quotes para filtrar por created_at.
    let query = hasRange
      ? supabase
          .from("quote_items")
          .select(
            "treatment_id, description, quantity, line_total, quotes!inner(created_at)"
          )
      : supabase
          .from("quote_items")
          .select("treatment_id, description, quantity, line_total");

    if (range?.from) {
      query = query.gte(
        "quotes.created_at",
        rangeStartIso(range.from, timeZone)
      );
    }
    if (range?.to) {
      // Fin de día inclusivo para que el filtro cubra todo el día `to`.
      query = query.lte(
        "quotes.created_at",
        inclusiveEndIso(range.to, timeZone)
      );
    }

    const { data, error } = await query;
    if (error) return null;

    const byKey = new Map<string, TopTreatment>();
    for (const row of data ?? []) {
      const key = row.treatment_id ?? row.description;
      const existing = byKey.get(key);
      const quantity = Number(row.quantity ?? 0);
      const lineTotal = Number(row.line_total ?? 0);
      if (existing) {
        existing.count += quantity;
        existing.revenue += lineTotal;
      } else {
        byKey.set(key, {
          key,
          name: row.description,
          count: quantity,
          revenue: lineTotal,
        });
      }
    }

    return Array.from(byKey.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch {
    return null;
  }
}

export async function getRevenueTrend(
  months = 6,
  range?: { from?: string; to?: string }
): Promise<RevenueTrendPoint[] | null> {
  try {
    const supabase = await createClient();
    const timeZone = await resolveClinicTimezone();
    const hasRange = Boolean(range?.from || range?.to);

    let query = supabase.from("payments").select("amount, paid_at");
    const buckets = new Map<string, number>();
    const order: string[] = [];

    if (!hasRange) {
      // Comportamiento exacto previo: últimos `months` meses desde hoy (timezone clínica).
      const earliest = monthRange(months - 1, timeZone).start;
      query = query.gte("paid_at", earliest.toISOString());

      for (let i = months - 1; i >= 0; i--) {
        const { start } = monthRange(i, timeZone);
        const parts = civilDatePartsInTimeZone(start, timeZone);
        const key = monthKey(parts.year, parts.month);
        buckets.set(key, 0);
        order.push(key);
      }
    } else {
      const toParts = range?.to
        ? parseDateOnlyParts(range.to)
        : civilDatePartsInTimeZone(new Date(), timeZone);

      let fromYear: number;
      let fromMonth: number;
      let fromDay: number;
      if (range?.from) {
        const parts = parseDateOnlyParts(range.from);
        fromYear = parts.year;
        fromMonth = parts.month;
        fromDay = parts.day;
      } else {
        const fromAnchor = new Date(
          Date.UTC(toParts.year, toParts.month - 1 - (months - 1), 1)
        );
        fromYear = fromAnchor.getUTCFullYear();
        fromMonth = fromAnchor.getUTCMonth() + 1;
        fromDay = 1;
      }

      const fromFilter = range?.from
        ? rangeStartIso(range.from, timeZone)
        : zonedMidnightToUtc(fromYear, fromMonth, fromDay, timeZone).toISOString();
      // Fin de día inclusivo cuando `to` es fecha; si no hay `to`, hasta ahora.
      const toFilter = range?.to
        ? inclusiveEndIso(range.to, timeZone)
        : new Date().toISOString();

      query = query.gte("paid_at", fromFilter).lte("paid_at", toFilter);

      const cursor = new Date(Date.UTC(fromYear, fromMonth - 1, 1));
      const endMonth = new Date(Date.UTC(toParts.year, toParts.month - 1, 1));
      while (cursor <= endMonth) {
        const key = monthKey(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth() + 1
        );
        buckets.set(key, 0);
        order.push(key);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }

    const { data, error } = await query;
    if (error) return null;

    for (const row of data ?? []) {
      const paidAt = new Date(row.paid_at);
      const parts = civilDatePartsInTimeZone(paidAt, timeZone);
      const key = monthKey(parts.year, parts.month);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(row.amount ?? 0));
      }
    }

    return order.map((key) => {
      const [, monthNum] = key.split("-");
      return {
        month: key,
        label: MONTH_LABELS[Number(monthNum) - 1],
        total: buckets.get(key) ?? 0,
      };
    });
  } catch {
    return null;
  }
}
