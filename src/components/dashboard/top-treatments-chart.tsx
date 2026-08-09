"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TopTreatment } from "@/lib/supabase/insights";

const chartConfig = {
  count: {
    label: "Usos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function TopTreatmentsChart({
  data,
  currencyFormatter,
}: {
  data: TopTreatment[];
  currencyFormatter: Intl.NumberFormat;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: Math.max(data.length * 40, 100) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={160}
          tick={{ fontSize: 12 }}
          tickFormatter={(value: string) =>
            value.length > 24 ? `${value.slice(0, 24)}…` : value
          }
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const treatment = item.payload as
                  | { name?: string; revenue?: number }
                  | undefined;
                return (
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {treatment?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {value} usos ·{" "}
                      {currencyFormatter.format(Number(treatment?.revenue ?? 0))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={20}>
          <LabelList dataKey="count" position="right" className="fill-foreground" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
