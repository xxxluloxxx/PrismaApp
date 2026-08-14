"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";

import { ConfirmationStep } from "./confirmation-step";
import { ContactStep, type ContactFormValues } from "./contact-step";
import { DoctorStep, TreatmentStep } from "./selection-steps";
import { SlotStep } from "./slot-step";
import type {
  ApiSlot,
  BookingOptions,
  BookingSlot,
  ConfirmedBooking,
} from "./types";

const SLOT_DAYS = 14;
const ANY_DOCTOR = "any";
const UNSURE_TREATMENT = "unsure";

// Duplicado a propósito: las mismas funciones puras existen en
// `@/lib/booking/slots.ts` y `@/lib/supabase/clinic-timezone.ts`, pero esos
// módulos encadenan un import (dinámico, nunca invocado aquí) hacia
// `next/headers` a través de `clinic-settings.ts` / `server.ts`. Turbopack
// sigue esa cadena estáticamente para el bundle de cliente y falla el build,
// así que este componente cliente usa su propia copia mínima en vez de
// importar esos archivos server-aware.
const DEFAULT_CLINIC_TIMEZONE = "America/Guayaquil";

function civilDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addCivilDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

type Step = "doctor" | "treatment" | "slots" | "contact" | "done";

const STEP_LABELS: Record<Exclude<Step, "done">, string> = {
  doctor: "Paso 1 de 4 · Médico",
  treatment: "Paso 2 de 4 · Motivo",
  slots: "Paso 3 de 4 · Horario",
  contact: "Paso 4 de 4 · Tus datos",
};
const STEP_PROGRESS: Record<Exclude<Step, "done">, number> = {
  doctor: 20,
  treatment: 40,
  slots: 60,
  contact: 80,
};

const EMPTY_CONTACT: ContactFormValues = {
  document_id: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  website: "",
};

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function BookingWizard() {
  const [step, setStep] = useState<Step>("doctor");

  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [doctorId, setDoctorId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsLoadingMore, setSlotsLoadingMore] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [rangeFrom, setRangeFrom] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const [contactValues, setContactValues] =
    useState<ContactFormValues>(EMPTY_CONTACT);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [confirmedBooking, setConfirmedBooking] =
    useState<ConfirmedBooking | null>(null);

  const timezone = options?.timezone ?? DEFAULT_CLINIC_TIMEZONE;

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const response = await fetch("/api/public/booking/options", {
        cache: "no-store",
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "No se pudieron cargar las opciones de reserva."
        );
      }
      setOptions(body as unknown as BookingOptions);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las opciones de reserva.";
      setOptionsError(message);
      toast.error(message);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    // La carga inicial sincroniza el wizard con el API público.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOptions();
  }, [loadOptions]);

  function selectedDurationMinutes(): number {
    if (!options) return 30;
    if (!treatmentId || treatmentId === UNSURE_TREATMENT) {
      return options.default_duration_minutes;
    }
    const treatment = options.treatments.find((t) => t.id === treatmentId);
    return treatment?.duration_minutes ?? options.default_duration_minutes;
  }

  function treatmentLabel(): string {
    if (!options || !treatmentId || treatmentId === UNSURE_TREATMENT) {
      return "Consulta general";
    }
    return (
      options.treatments.find((t) => t.id === treatmentId)?.name ??
      "Consulta general"
    );
  }

  async function fetchSlotsForDoctor(
    id: string,
    from: string,
    days: number
  ): Promise<BookingSlot[]> {
    const params = new URLSearchParams({
      doctor_id: id,
      duration_minutes: String(selectedDurationMinutes()),
      days: String(days),
      from,
    });
    const response = await fetch(`/api/public/booking/slots?${params}`, {
      cache: "no-store",
    });
    const body = await readJson(response);
    if (!response.ok) {
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : "No se pudieron calcular los horarios disponibles."
      );
    }
    const apiSlots = (body.slots as ApiSlot[] | undefined) ?? [];
    return apiSlots.map((slot) => ({ ...slot, doctor_id: id }));
  }

  const loadSlots = useCallback(
    async (from: string, append: boolean) => {
      if (!options) return;
      if (append) {
        setSlotsLoadingMore(true);
      } else {
        setSlotsLoading(true);
      }
      setSlotsError(null);
      try {
        const targetDoctorIds =
          doctorId === ANY_DOCTOR
            ? options.doctors.map((doctor) => doctor.id)
            : [doctorId];

        const results = await Promise.all(
          targetDoctorIds.map((id) => fetchSlotsForDoctor(id, from, SLOT_DAYS))
        );
        const fetched = results.flat();

        fetched.sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );

        setSlots((current) => (append ? [...current, ...fetched] : fetched));
        setRangeFrom(addCivilDays(from, SLOT_DAYS));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudieron calcular los horarios disponibles.";
        setSlotsError(message);
        toast.error(message);
      } finally {
        if (append) {
          setSlotsLoadingMore(false);
        } else {
          setSlotsLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, doctorId, treatmentId]
  );

  function goToSlots() {
    setStep("slots");
    setSelectedSlot(null);
    const from = civilDateInTimeZone(new Date(), timezone);
    setRangeFrom(from);
    void loadSlots(from, false);
  }

  function handleLoadMore() {
    if (!rangeFrom) return;
    void loadSlots(rangeFrom, true);
  }

  function handleRetrySlots() {
    const from = civilDateInTimeZone(new Date(), timezone);
    setRangeFrom(from);
    void loadSlots(from, false);
  }

  async function handleConfirm() {
    if (!selectedSlot || !options) return;
    setSubmitting(true);
    setSubmitError(null);

    const isUnsureTreatment = !treatmentId || treatmentId === UNSURE_TREATMENT;

    try {
      const response = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: contactValues.website,
          doctor_id: selectedSlot.doctor_id,
          ...(isUnsureTreatment ? {} : { treatment_id: treatmentId }),
          starts_at: selectedSlot.starts_at,
          ...(isUnsureTreatment
            ? { duration_minutes: options.default_duration_minutes }
            : {}),
          patient: {
            document_id: contactValues.document_id.trim(),
            first_name: contactValues.first_name.trim(),
            last_name: contactValues.last_name.trim(),
            phone: contactValues.phone.trim(),
            ...(contactValues.email.trim()
              ? { email: contactValues.email.trim() }
              : {}),
          },
        }),
      });

      const body = await readJson(response);

      if (response.status === 409) {
        const message =
          typeof body.error === "string"
            ? body.error
            : "Ese horario ya no está disponible, elige otro.";
        toast.error(message);
        setSubmitError(message);
        setStep("slots");
        setSelectedSlot(null);
        const from = civilDateInTimeZone(new Date(), timezone);
        setRangeFrom(from);
        void loadSlots(from, false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "No se pudo completar la reserva."
        );
      }

      const doctorName =
        options.doctors.find((d) => d.id === (body.doctor_id as string))
          ?.full_name ?? "Médico disponible";

      setConfirmedBooking({
        appointment_id: String(body.appointment_id ?? ""),
        doctor_id: String(body.doctor_id ?? selectedSlot.doctor_id),
        starts_at: String(body.starts_at ?? selectedSlot.starts_at),
        ends_at: String(body.ends_at ?? selectedSlot.ends_at),
        doctor_name: doctorName,
        treatment_name: isUnsureTreatment ? null : treatmentLabel(),
      });
      setStep("done");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo completar la reserva.";
      toast.error(message);
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (optionsLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (optionsError || !options) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          {optionsError ?? "No se pudieron cargar las opciones de reserva."}
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline underline-offset-4"
          onClick={() => void loadOptions()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step !== "done" ? (
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {STEP_LABELS[step]}
          </p>
          <Progress value={STEP_PROGRESS[step]}>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        </div>
      ) : null}

      {step === "doctor" ? (
        <DoctorStep
          doctors={options.doctors}
          value={doctorId}
          onChange={setDoctorId}
          onNext={() => setStep("treatment")}
        />
      ) : null}

      {step === "treatment" ? (
        <TreatmentStep
          treatments={options.treatments}
          value={treatmentId}
          onChange={setTreatmentId}
          defaultDuration={options.default_duration_minutes}
          onBack={() => setStep("doctor")}
          onNext={goToSlots}
        />
      ) : null}

      {step === "slots" ? (
        <SlotStep
          slots={slots}
          doctors={options.doctors}
          timezone={timezone}
          selectedSlot={selectedSlot}
          loading={slotsLoading}
          loadingMore={slotsLoadingMore}
          error={slotsError}
          onSelect={setSelectedSlot}
          onRetry={handleRetrySlots}
          onLoadMore={handleLoadMore}
          onBack={() => setStep("treatment")}
          onNext={() => setStep("contact")}
        />
      ) : null}

      {step === "contact" && selectedSlot ? (
        <ContactStep
          slot={selectedSlot}
          doctors={options.doctors}
          timezone={timezone}
          treatmentLabel={treatmentLabel()}
          values={contactValues}
          onChange={setContactValues}
          submitting={submitting}
          error={submitError}
          onBack={() => setStep("slots")}
          onSubmit={() => void handleConfirm()}
        />
      ) : null}

      {step === "done" && confirmedBooking ? (
        <ConfirmationStep booking={confirmedBooking} timezone={timezone} />
      ) : null}
    </div>
  );
}
