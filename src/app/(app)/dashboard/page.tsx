import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isAdmin } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const result = await getCurrentProfile();
  const profile = result.profile;

  const [patientsActive, appointmentsToday, pendingQuotes, partialQuotes] =
    await Promise.all([
      countPatientsActive(),
      countAppointmentsToday(),
      countQuotesByStatus("pending"),
      countQuotesByStatus("partially_paid"),
    ]);

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Hola{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Resumen operativo de la clínica
        </p>
        {profile ? (
          <div className="mt-2">
            <Badge>{isAdmin(profile) ? "Administrador" : "Médico"}</Badge>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
