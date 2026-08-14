"use client";

import { CalendarClock, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BookingDoctor, BookingSlot } from "./types";

export type ContactFormValues = {
  document_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  website: string;
};

type ContactStepProps = {
  slot: BookingSlot;
  doctors: BookingDoctor[];
  timezone: string;
  treatmentLabel: string;
  values: ContactFormValues;
  onChange: (values: ContactFormValues) => void;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
};

export function ContactStep({
  slot,
  doctors,
  timezone,
  treatmentLabel,
  values,
  onChange,
  submitting,
  error,
  onBack,
  onSubmit,
}: ContactStepProps) {
  const doctorName =
    doctors.find((doctor) => doctor.id === slot.doctor_id)?.full_name ??
    "Médico disponible";
  const dateFormatter = new Intl.DateTimeFormat("es-EC", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  function set<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) {
    onChange({ ...values, [key]: value });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const summaryLabel = dateFormatter.format(new Date(slot.starts_at));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Tus datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los usaremos solo para confirmar tu cita.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-secondary/40 p-4 text-sm">
        <CalendarClock aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium capitalize">{summaryLabel}</p>
          <p className="text-muted-foreground">
            {doctorName} · {treatmentLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_name">Nombres</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            autoComplete="given-name"
            disabled={submitting}
            value={values.first_name}
            onChange={(event) => set("first_name", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last_name">Apellidos</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            autoComplete="family-name"
            disabled={submitting}
            value={values.last_name}
            onChange={(event) => set("last_name", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="document_id">Identificación</Label>
          <Input
            id="document_id"
            name="document_id"
            required
            autoComplete="off"
            disabled={submitting}
            value={values.document_id}
            onChange={(event) => set("document_id", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            disabled={submitting}
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            disabled={submitting}
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </div>
      </div>

      {/*
        Honeypot anti-spam: invisible para una persona (fuera de pantalla,
        sin foco por teclado) pero visible para la mayoría de bots que
        completan todos los campos de un formulario. No usar display:none
        ni visibility:hidden, algunos bots los detectan y los saltan.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <Label htmlFor="website">No completar este campo</Label>
        <Input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => set("website", event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={submitting}
          onClick={onBack}
        >
          Volver
        </Button>
        <Button type="submit" size="lg" className="h-11" disabled={submitting}>
          {submitting ? (
            <>
              <LoaderCircle aria-hidden className="animate-spin" />
              Reservando…
            </>
          ) : (
            "Confirmar reserva"
          )}
        </Button>
      </div>
    </form>
  );
}
