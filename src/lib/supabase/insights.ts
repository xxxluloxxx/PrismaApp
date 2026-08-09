import { createClient } from "@/lib/supabase/server";

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

function monthRange(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue | null> {
  try {
    const supabase = await createClient();
    const current = monthRange(0);
    const previous = monthRange(1);

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

export async function getTopTreatments(limit = 10): Promise<TopTreatment[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quote_items")
      .select("treatment_id, description, quantity, line_total");

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

export async function getRevenueTrend(months = 6): Promise<RevenueTrendPoint[] | null> {
  try {
    const supabase = await createClient();
    const earliest = monthRange(months - 1).start;

    const { data, error } = await supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", earliest.toISOString());

    if (error) return null;

    const monthLabels = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const buckets = new Map<string, number>();
    const order: string[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const { start } = monthRange(i);
      const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, 0);
      order.push(key);
    }

    for (const row of data ?? []) {
      const paidAt = new Date(row.paid_at);
      const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(row.amount ?? 0));
      }
    }

    return order.map((key) => {
      const [, monthNum] = key.split("-");
      return {
        month: key,
        label: monthLabels[Number(monthNum) - 1],
        total: buckets.get(key) ?? 0,
      };
    });
  } catch {
    return null;
  }
}
