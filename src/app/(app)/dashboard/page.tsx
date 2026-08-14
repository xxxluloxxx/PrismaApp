import Link from "next/link";
import { Suspense } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CsvExportButton } from "@/components/dashboard/csv-export-button";
import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import { QuoteStatusChart } from "@/components/dashboard/quote-status-chart";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { TopTreatmentsChart } from "@/components/dashboard/top-treatments-chart";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/types/quote";
import { cn } from "@/lib/utils";
import {
  getMonthlyRevenue,
  getQuoteStatusPortfolio,
  getRevenueTrend,
  getTopTreatments,
} from "@/lib/supabase/insights";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

async function countPatientsActive(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function countAppointmentsToday(): Promise<number | null> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString());
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function countQuotesByStatus(
  status: "pending" | "partially_paid"
): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;
  const range =
    dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined;

  const result = await getCurrentProfile();
  const profile = result.profile;
  const admin = profile ? isAdmin(profile) : false;

  const [patientsActive, appointmentsToday, pendingQuotes, partialQuotes] =
    await Promise.all([
      countPatientsActive(),
      countAppointmentsToday(),
      countQuotesByStatus("pending"),
      countQuotesByStatus("partially_paid"),
    ]);

  const [monthlyRevenue, topTreatments, revenueTrend, quoteStatusPortfolio] =
    admin
      ? await Promise.all([
          getMonthlyRevenue(),
          getTopTreatments(10, range),
          getRevenueTrend(6, range),
          getQuoteStatusPortfolio(range),
        ])
      : [null, null, null, null];

  const metrics = [
    {
      title: "Pacientes activos",
      value: patientsActive,
      href: "/pacientes",
    },
    {
      title: "Citas hoy",
      value: appointmentsToday,
      href: "/agenda",
    },
    {
      title: "Presupuestos pendientes",
      value: pendingQuotes,
      href: "/presupuestos",
    },
    {
      title: "Pagos parciales",
      value: partialQuotes,
      href: "/presupuestos",
    },
  ];

  const hasTreatments = (topTreatments?.length ?? 0) > 0;
  const hasTrendData = (revenueTrend ?? []).some((p) => p.total > 0);
  const hasPortfolioData = (quoteStatusPortfolio ?? []).some((p) => p.count > 0);

  const portfolioCsvRows = (quoteStatusPortfolio ?? []).map((row) => ({
    Estado: QUOTE_STATUS_LABELS[row.status as QuoteStatus],
    Cantidad: row.count,
    Total: row.total,
  }));

  const trendCsvRows = (revenueTrend ?? []).map((row) => ({
    Mes: row.month,
    Total: row.total,
  }));

  const treatmentsCsvRows = (topTreatments ?? []).map((row) => ({
    Tratamiento: row.name,
    Cantidad: row.count,
    Ingresos: row.revenue,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Hola{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Resumen operativo de la clínica
        </p>
        {profile ? (
          <div className="mt-2">
            <Badge>{admin ? "Administrador" : "Médico"}</Badge>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="pb-2">
              <CardDescription>{m.title}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {m.value === null ? "—" : m.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={m.href}
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "h-auto px-0"
                )}
              >
                Ver detalle
              </Link>
              {m.value === null ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dato no disponible (¿migración pendiente?)
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {admin ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Insights
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Panorama financiero y de tratamientos de la clínica
              </p>
            </div>
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Cargando filtros…</p>
              }
            >
              <DashboardDateFilter
                filters={{
                  dateFrom: dateFrom ?? "",
                  dateTo: dateTo ?? "",
                }}
              />
            </Suspense>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Ingresos del mes */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Ingresos de este mes</CardDescription>
                <CardTitle className="font-heading text-3xl tabular-nums">
                  {monthlyRevenue
                    ? currencyFormatter.format(monthlyRevenue.currentMonthTotal)
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyRevenue ? (
                  monthlyRevenue.changePct === null ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Minus className="size-3.5" />
                      Sin datos del mes anterior para comparar
                    </p>
                  ) : (
                    <p
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        monthlyRevenue.changePct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      )}
                    >
                      {monthlyRevenue.changePct >= 0 ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                      {monthlyRevenue.changePct >= 0 ? "+" : ""}
                      {monthlyRevenue.changePct.toFixed(1)}% vs. mes anterior
                    </p>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Dato no disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tendencia de ingresos */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div>
                  <CardDescription>Tendencia de ingresos</CardDescription>
                  <CardTitle className="text-base font-medium">
                    Últimos 6 meses
                  </CardTitle>
                </div>
                {hasTrendData ? (
                  <CsvExportButton
                    filename="tendencia-ingresos.csv"
                    rows={trendCsvRows}
                  />
                ) : null}
              </CardHeader>
              <CardContent>
                {revenueTrend && hasTrendData ? (
                  <RevenueTrendChart data={revenueTrend} />
                ) : (
                  <div className="flex h-[180px] items-center justify-center text-center text-sm text-muted-foreground">
                    Aún no hay suficientes datos de pagos para mostrar una
                    tendencia
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cartera por estado */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div>
                <CardDescription>Cartera de presupuestos</CardDescription>
                <CardTitle className="text-base font-medium">
                  Distribución por estado
                </CardTitle>
              </div>
              {hasPortfolioData ? (
                <CsvExportButton
                  filename="cartera-presupuestos.csv"
                  rows={portfolioCsvRows}
                />
              ) : null}
            </CardHeader>
            <CardContent>
              {quoteStatusPortfolio && hasPortfolioData ? (
                <QuoteStatusChart data={quoteStatusPortfolio} />
              ) : (
                <div className="flex h-[180px] items-center justify-center text-center text-sm text-muted-foreground">
                  Aún no hay suficientes datos de presupuestos para mostrar la
                  cartera por estado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top tratamientos */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div>
                <CardDescription>Top tratamientos más usados</CardDescription>
                <CardTitle className="text-base font-medium">
                  Según presupuestos generados
                </CardTitle>
              </div>
              {hasTreatments ? (
                <CsvExportButton
                  filename="top-tratamientos.csv"
                  rows={treatmentsCsvRows}
                />
              ) : null}
            </CardHeader>
            <CardContent>
              {hasTreatments && topTreatments ? (
                <TopTreatmentsChart data={topTreatments} />
              ) : (
                <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
                  Aún no hay suficientes datos. Cuando se generen
                  presupuestos con tratamientos, aparecerán aquí.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
