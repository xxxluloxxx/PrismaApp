"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { DayDetailSheet } from "@/components/agenda/day-detail-sheet";
import { Button } from "@/components/ui/button";
import {
  LEGEND_STATUSES,
  STATUS_CHIP_CLASS,
  STATUS_DOT_CLASS,
  WEEKDAY_LABELS,
  buildMonthGrid,
  shortPatientName,
  formatAppointmentTime,
  formatMonthTitle,
  isSameMonth,
  localDayKey,
  todayLocalKey,
} from "@/lib/agenda/calendar";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import type { AppointmentWithRelations } from "@/lib/types/appointment";
import { cn } from "@/lib/utils";

export function AppointmentsCalendarView({
  appointments,
  visibleMonth,
  onVisibleMonthChange,
  loading,
  error,
  onRetry,
}: {
  appointments: AppointmentWithRelations[];
  visibleMonth: Date;
  onVisibleMonthChange: (next: Date) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = todayLocalKey();
  const isCurrentMonth = isSameMonth(visibleMonth, new Date());
  const monthTitle = formatMonthTitle(visibleMonth);

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const appt of appointments) {
      const key = localDayKey(appt.starts_at);
      const list = map.get(key) ?? [];
      list.push(appt);
      map.set(key, list);
    }
    for (const [key, list] of map) {
      map.set(
        key,
        [...list].sort(
          (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        )
      );
    }
    return map;
  }, [appointments]);

  function goPrevMonth() {
    onVisibleMonthChange(new Date(year, month - 1, 1));
  }

  function goNextMonth() {
    onVisibleMonthChange(new Date(year, month + 1, 1));
  }

  function goToday() {
    const now = new Date();
    onVisibleMonthChange(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function openDay(dayKey: string) {
    setSelectedDay(dayKey);
    setSheetOpen(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 md:size-9"
          onClick={goPrevMonth}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <h2 className="min-w-0 flex-1 text-center font-heading text-xl font-semibold">
          {loading ? (
            <span className="mx-auto inline-block h-7 w-40 animate-pulse rounded-md bg-muted" />
          ) : (
            monthTitle
          )}
        </h2>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 md:size-9"
          onClick={goNextMonth}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-5" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={goToday}
          disabled={isCurrentMonth}
        >
          Hoy
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-destructive">No se pudieron cargar las citas.</p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <CalendarSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="bg-card px-1 py-1.5 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                {label}
              </div>
            ))}

            {cells.map((cell) => {
              const dayAppts = byDay.get(cell.dayKey) ?? [];
              const isToday = cell.dayKey === todayKey;
              const visible = dayAppts.slice(0, 3);
              const extra = dayAppts.length - 3;
              const statusDots = [...new Set(dayAppts.map((a) => a.status))].slice(0, 4);

              return (
                <div
                  key={cell.dayKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDay(cell.dayKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDay(cell.dayKey);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 bg-card p-1 text-left transition-colors hover:bg-muted/50",
                    "aspect-square min-h-0 md:aspect-auto md:min-h-[6.5rem]",
                    !cell.inMonth && "text-muted-foreground/50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center text-sm tabular-nums md:size-7",
                      isToday && "rounded-full bg-primary font-semibold text-primary-foreground"
                    )}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Desktop: chips con hora + nombre */}
                  <div className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden md:flex">
                    {visible.map((appt) => (
                      <div
                        key={appt.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[11px] leading-tight",
                          STATUS_CHIP_CLASS[appt.status]
                        )}
                        title={`${formatAppointmentTime(appt.starts_at)} ${appt.patient_name}`}
                      >
                        {formatAppointmentTime(appt.starts_at)} {shortPatientName(appt.patient_name)}
                      </div>
                    ))}
                    {extra > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        +{extra} más
                      </span>
                    )}
                  </div>

                  {/* Móvil: puntos de color por estado distinto */}
                  <div className="mt-auto flex flex-wrap justify-center gap-0.5 md:hidden">
                    {statusDots.map((status) => (
                      <span
                        key={status}
                        className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {LEGEND_STATUSES.map((status) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
                {APPOINTMENT_STATUS_LABELS[status]}
              </div>
            ))}
          </div>
        </>
      )}

      <DayDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        dayKey={selectedDay}
        appointments={appointments}
      />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="bg-card px-1 py-1.5 text-center text-xs font-medium uppercase text-muted-foreground"
        >
          {label}
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse bg-muted md:aspect-auto md:min-h-[6.5rem]"
        />
      ))}
    </div>
  );
}
