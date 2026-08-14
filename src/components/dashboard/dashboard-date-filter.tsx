"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DashboardDateFilter({
  filters,
}: {
  filters: { dateFrom: string; dateTo: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasFilters = Boolean(filters.dateFrom || filters.dateTo);

  function pushParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  function applyThisMonth() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    pushParams({
      dateFrom: formatLocalDate(from),
      dateTo: formatLocalDate(now),
    });
  }

  function applyLast30Days() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    pushParams({
      dateFrom: formatLocalDate(from),
      dateTo: formatLocalDate(to),
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        type="date"
        aria-label="Desde"
        value={filters.dateFrom}
        onChange={(e) => pushParams({ dateFrom: e.target.value })}
        className="w-full sm:w-auto"
      />
      <Input
        type="date"
        aria-label="Hasta"
        value={filters.dateTo}
        onChange={(e) => pushParams({ dateTo: e.target.value })}
        className="w-full sm:w-auto"
      />
      <Button type="button" variant="outline" size="sm" onClick={applyThisMonth}>
        Este mes
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={applyLast30Days}
      >
        Últimos 30 días
      </Button>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => pushParams({ dateFrom: "", dateTo: "" })}
        >
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
