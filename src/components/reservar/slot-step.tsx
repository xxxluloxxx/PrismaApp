"use client";

import { AlertCircle, CalendarDays, Clock3, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { BookingDoctor, BookingSlot } from "./types";

type SlotGroup = {
  key: string;
  label: string;
  slots: BookingSlot[];
};

function groupSlots(slots: BookingSlot[], timezone: string): SlotGroup[] {
  const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayLabelFormatter = new Intl.DateTimeFormat("es-EC", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const groups = new Map<string, SlotGroup>();

  for (const slot of slots) {
    const date = new Date(slot.starts_at);
    const key = dayKeyFormatter.format(date);
    const current = groups.get(key);
    if (current) {
      current.slots.push(slot);
    } else {
      const label = dayLabelFormatter.format(date);
      groups.set(key, {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        slots: [slot],
      });
    }
  }

  return Array.from(groups.values());
}

type SlotStepProps = {
  slots: BookingSlot[];
  doctors: BookingDoctor[];
  timezone: string;
  selectedSlot: BookingSlot | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onSelect: (slot: BookingSlot) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function SlotStep({
  slots,
  doctors,
  timezone,
  selectedSlot,
  loading,
  loadingMore,
  error,
  onSelect,
  onRetry,
  onLoadMore,
  onBack,
  onNext,
}: SlotStepProps) {
  const groups = groupSlots(slots, timezone);
  const doctorNames = new Map(doctors.map((doctor) => [doctor.id, doctor.full_name]));
  const timeFormatter = new Intl.DateTimeFormat("es-EC", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold">
          Elige un horario
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las horas se muestran en la zona horaria de la clínica.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm"
        >
          <AlertCircle
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <div className="flex-1">
            <p>{error}</p>
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto p-0 text-foreground"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed">
          <div className="text-center text-sm text-muted-foreground">
            <LoaderCircle
              aria-hidden
              className="mx-auto mb-2 size-6 animate-spin"
            />
            Buscando horarios disponibles…
          </div>
        </div>
      ) : groups.length ? (
        <div className="max-h-[52vh] space-y-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`day-${group.key}`}>
              <h3
                id={`day-${group.key}`}
                className="mb-2 flex items-center gap-2 text-sm font-semibold"
              >
                <CalendarDays aria-hidden className="size-4 text-primary" />
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {group.slots.map((slot) => {
                  const isSelected =
                    selectedSlot?.doctor_id === slot.doctor_id &&
                    selectedSlot.starts_at === slot.starts_at;

                  return (
                    <Button
                      key={`${slot.doctor_id}-${slot.starts_at}`}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-auto min-h-14 flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left",
                        isSelected && "ring-2 ring-primary/20"
                      )}
                      onClick={() => onSelect(slot)}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Clock3 aria-hidden className="size-3.5" />
                        {timeFormatter.format(new Date(slot.starts_at))}
                      </span>
                      <span className="w-full truncate text-xs font-normal opacity-75">
                        {doctorNames.get(slot.doctor_id) ?? "Médico disponible"}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <CalendarDays
            aria-hidden
            className="mx-auto mb-3 size-8 text-muted-foreground"
          />
          <p className="font-medium">No hay horarios en este rango</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Amplía la búsqueda para encontrar una fecha posterior.
          </p>
        </div>
      )}

      {!loading ? (
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? (
            <>
              <LoaderCircle aria-hidden className="animate-spin" />
              Buscando…
            </>
          ) : (
            "Ver más días"
          )}
        </Button>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          onClick={onBack}
        >
          Volver
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-11"
          disabled={!selectedSlot}
          onClick={onNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
