"use client";

import { CalendarCheck2, CalendarPlus, Check, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadAppointmentIcs } from "@/lib/booking/ics";

import type { ConfirmedBooking } from "./types";

type SuccessStepProps = {
  booking: ConfirmedBooking;
  timezone: string;
  onRestart: () => void;
};

export function SuccessStep({
  booking,
  timezone,
  onRestart,
}: SuccessStepProps) {
  const dateFormatter = new Intl.DateTimeFormat("es-EC", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <Check aria-hidden className="size-8" strokeWidth={2.5} />
      </div>

      <div>
        <h2 className="font-heading text-3xl font-semibold">
          Tu cita está reservada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Guarda la fecha en tu calendario para tenerla a mano.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-secondary/50 p-4 text-left text-sm">
        <p className="flex items-start gap-2">
          <CalendarCheck2
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span className="capitalize">
            {dateFormatter.format(new Date(booking.starts_at))}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Stethoscope
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span>
            {booking.doctor_name}
            {booking.treatment_name ? ` · ${booking.treatment_name}` : ""}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full"
          onClick={() =>
            downloadAppointmentIcs({
              appointmentId: booking.appointment_id,
              startsAt: booking.starts_at,
              endsAt: booking.ends_at,
              doctorName: booking.doctor_name,
              treatmentName: booking.treatment_name,
            })
          }
        >
          <CalendarPlus aria-hidden />
          Añadir a mi calendario
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onRestart}
        >
          Hacer otra reserva
        </Button>
      </div>
    </div>
  );
}
