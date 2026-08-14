"use client";

import { CalendarDays, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppointmentsCalendarView } from "@/components/agenda/appointments-calendar-view";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { visibleGridBounds } from "@/lib/agenda/calendar";
import { listAppointmentsClient } from "@/lib/supabase/appointment-client";
import { useRealtimeRefresh } from "@/lib/supabase/realtime";
import type { AppointmentWithRelations } from "@/lib/types/appointment";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import { cn } from "@/lib/utils";

type View = "lista" | "calendario";

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
      <Button
        type="button"
        size="sm"
        variant={view === "lista" ? "secondary" : "ghost"}
        className="shadow-none"
        aria-pressed={view === "lista"}
        onClick={() => onChange("lista")}
      >
        <List data-icon="inline-start" />
        Lista
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "calendario" ? "secondary" : "ghost"}
        className="shadow-none"
        aria-pressed={view === "calendario"}
        onClick={() => onChange("calendario")}
      >
        <CalendarDays data-icon="inline-start" />
        Calendario
      </Button>
    </div>
  );
}

function ListView({ appointments }: { appointments: AppointmentWithRelations[] }) {
  const router = useRouter();
  const grouped = new Map<string, AppointmentWithRelations[]>();
  for (const appt of appointments) {
    const day = new Date(appt.starts_at).toLocaleDateString("es-EC", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const list = grouped.get(day) ?? [];
    list.push(appt);
    grouped.set(day, list);
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay citas en este rango.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(grouped.entries()).map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold capitalize">{day}</h2>

          <div className="flex flex-col gap-2 sm:hidden">
            {items.map((appt) => {
              const start = new Date(appt.starts_at);
              const end = new Date(appt.ends_at);
              return (
                <Card
                  key={appt.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/agenda/${appt.id}`)}
                >
                  <CardContent className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {start.toLocaleTimeString("es-EC", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {end.toLocaleTimeString("es-EC", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[appt.status]}</Badge>
                        {appt.source === "online" ? (
                          <Badge variant="outline" className="text-[10px]">
                            Online
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{appt.patient_name}</span>
                    <span className="text-sm text-muted-foreground">{appt.doctor_name}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((appt) => {
                  const start = new Date(appt.starts_at);
                  const end = new Date(appt.ends_at);
                  return (
                    <TableRow
                      key={appt.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/agenda/${appt.id}`)}
                    >
                      <TableCell>
                        <Link
                          href={`/agenda/${appt.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {start.toLocaleTimeString("es-EC", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {end.toLocaleTimeString("es-EC", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Link>
                      </TableCell>
                      <TableCell>{appt.patient_name}</TableCell>
                      <TableCell>{appt.doctor_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary">{APPOINTMENT_STATUS_LABELS[appt.status]}</Badge>
                          {appt.source === "online" ? (
                            <Badge variant="outline" className="text-[10px]">
                              Online
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}

export function AppointmentsAgenda({
  appointments,
}: {
  appointments: AppointmentWithRelations[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView: View = searchParams.get("vista") === "calendario" ? "calendario" : "lista";
  const [view, setView] = useState<View>(initialView);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reloadToken, setReloadToken] = useState(0);
  const [calendarResult, setCalendarResult] = useState<{
    key: string;
    data: AppointmentWithRelations[];
    error: boolean;
  } | null>(null);

  const bumpCalendarReload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);
  useRealtimeRefresh("appointments", true, bumpCalendarReload);

  const changeView = useCallback(
    (next: View) => {
      setView(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "calendario") {
        params.set("vista", "calendario");
      } else {
        params.delete("vista");
      }
      const query = params.toString();
      router.replace(query ? `/agenda?${query}` : "/agenda", { scroll: false });
    },
    [router, searchParams]
  );

  const calendarKey = `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${reloadToken}`;

  useEffect(() => {
    if (view !== "calendario") return;
    let cancelled = false;

    const { from, to } = visibleGridBounds(visibleMonth);
    listAppointmentsClient({ from, to }).then((result) => {
      if (cancelled) return;
      setCalendarResult({
        key: calendarKey,
        data: result.error ? [] : result.data,
        error: Boolean(result.error),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [view, calendarKey, visibleMonth]);

  const calendarLoading = view === "calendario" && calendarResult?.key !== calendarKey;
  const calendarAppointments =
    calendarResult && calendarResult.key === calendarKey ? calendarResult.data : [];
  const calendarError = Boolean(
    calendarResult && calendarResult.key === calendarKey && calendarResult.error
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {view === "lista" ? "Citas de la clínica (próximos 30 días)" : "Citas de la clínica"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={changeView} />
          <Link href="/agenda/nueva" className={cn(buttonVariants())}>
            Agendar cita
          </Link>
        </div>
      </div>

      {view === "lista" ? (
        <ListView appointments={appointments} />
      ) : (
        <AppointmentsCalendarView
          appointments={calendarAppointments}
          visibleMonth={visibleMonth}
          onVisibleMonthChange={setVisibleMonth}
          loading={calendarLoading}
          error={calendarError}
          onRetry={() => setReloadToken((t) => t + 1)}
        />
      )}
    </div>
  );
}
