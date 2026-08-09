"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatAppointmentTime, localDayKey } from "@/lib/agenda/calendar";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/types/appointment";
import type { AppointmentWithRelations } from "@/lib/types/appointment";
import { cn } from "@/lib/utils";

function formatDayTitle(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  const raw = date.toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function DayDetailSheet({
  open,
  onOpenChange,
  dayKey,
  appointments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayKey: string | null;
  appointments: AppointmentWithRelations[];
}) {
  const dayAppointments = useMemo(() => {
    if (!dayKey) return [];
    return appointments
      .filter((appt) => localDayKey(appt.starts_at) === dayKey)
      .sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
  }, [appointments, dayKey]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-xl sm:mx-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{dayKey ? formatDayTitle(dayKey) : ""}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-2">
          {dayAppointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin citas este día.
            </p>
          ) : (
            dayAppointments.map((appt) => (
              <Link
                key={appt.id}
                href={`/agenda/${appt.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">
                    {formatAppointmentTime(appt.starts_at)}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {appt.patient_name} · {appt.doctor_name}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {APPOINTMENT_STATUS_LABELS[appt.status]}
                </Badge>
              </Link>
            ))
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-between border-t px-4 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Link href="/agenda/nueva" className={cn(buttonVariants({ size: "sm" }))}>
            Agendar cita
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
