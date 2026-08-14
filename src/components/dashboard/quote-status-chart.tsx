"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { QuoteStatusSummary } from "@/lib/supabase/insights";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/types/quote";

const STATUS_COLORS: Record<QuoteStatusSummary["status"], string> = {
  draft: "var(--chart-1)",
  pending: "var(--chart-2)",
  partially_paid: "var(--chart-3)",
  paid: "var(--chart-4)",
  cancelled: "var(--chart-5)",
};

const chartConfig = {
  count: { label: "Cantidad" },
  draft: {
    label: QUOTE_STATUS_LABELS.draft,
    color: STATUS_COLORS.draft,
  },
  pending: {
    label: QUOTE_STATUS_LABELS.pending,
    color: STATUS_COLORS.pending,
  },
  partially_paid: {
    label: QUOTE_STATUS_LABELS.partially_paid,
    color: STATUS_COLORS.partially_paid,
  },
  paid: {
    label: QUOTE_STATUS_LABELS.paid,
    color: STATUS_COLORS.paid,
  },
  cancelled: {
    label: QUOTE_STATUS_LABELS.cancelled,
    color: STATUS_COLORS.cancelled,
  },
} satisfies ChartConfig;

// Instanciado en el cliente: un Intl.NumberFormat no se puede pasar como
// prop desde un Server Component (no es un objeto plano serializable).
const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function QuoteStatusChart({ data }: { data: QuoteStatusSummary[] }) {
  const chartData = data.map((row) => ({
    ...row,
    name: QUOTE_STATUS_LABELS[row.status as QuoteStatus],
    fill: `var(--color-${row.status})`,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: 260 }}
    >
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="status"
              formatter={(value, _name, item) => {
                const row = item.payload as
                  | { name?: string; total?: number; count?: number }
                  | undefined;
                return (
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {row?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {Number(value)} presupuestos ·{" "}
                      {currencyFormatter.format(Number(row?.total ?? 0))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={55}
          outerRadius={90}
          strokeWidth={2}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="status" className="flex-wrap" />}
        />
      </PieChart>
    </ChartContainer>
  );
}
