"use client";

import { CalendarCheck2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadAppointmentIcs } from "@/lib/booking/ics";

import type { ConfirmedBooking } from "./types";

type ConfirmationStepProps = {
  booking: ConfirmedBooking;
  timezone: string;
};

export function ConfirmationStep({ booking, timezone }: ConfirmationStepProps) {
  const dateFormatter = new Intl.DateTimeFormat("es-EC", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const summaryLabel = dateFormatter.format(new Date(booking.starts_at));

  function handleDownloadIcs() {
    downloadAppointmentIcs({
      appointmentId: booking.appointment_id,
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      doctorName: booking.doctor_name,
      treatmentName: booking.treatment_name,
    });
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CalendarCheck2 aria-hidden className="size-7" />
        </span>
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            ¡Cita reservada!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Te esperamos, la clínica confirmará tu cita pronto.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-secondary/40 p-4 text-left text-sm">
        <p className="font-medium capitalize">{summaryLabel}</p>
        <p className="mt-1 text-muted-foreground">
          {booking.doctor_name}
          {booking.treatment_name ? ` · ${booking.treatment_name}` : ""}
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="h-11 w-full"
        onClick={handleDownloadIcs}
      >
        <Download aria-hidden />
        Agregar al calendario
      </Button>
    </div>
  );
}
