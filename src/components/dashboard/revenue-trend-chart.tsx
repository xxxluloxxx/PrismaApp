"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RevenueTrendPoint } from "@/lib/supabase/insights";

const chartConfig = {
  total: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RevenueTrendChart({
  data,
  currencyFormatter,
}: {
  data: RevenueTrendPoint[];
  currencyFormatter: Intl.NumberFormat;
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[180px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis hide />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">
                  {currencyFormatter.format(Number(value))}
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          fill="url(#fillRevenue)"
          stroke="var(--color-total)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
