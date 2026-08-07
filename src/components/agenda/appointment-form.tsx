"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createAppointmentAction } from "@/lib/appointments/actions";
import type { Profile } from "@/lib/types/profile";
import type { Patient } from "@/lib/types/patient";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AppointmentForm({
  patients,
  doctors,
  defaultDoctorId,
}: {
  patients: Patient[];
  doctors: Profile[];
  defaultDoctorId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") ?? "");
    const startTime = String(form.get("start_time") ?? "");
    const endTime = String(form.get("end_time") ?? "");
    const starts_at = new Date(`${date}T${startTime}:00`).toISOString();
    const ends_at = new Date(`${date}T${endTime}:00`).toISOString();

    if (ends_at <= starts_at) {
      setError("La hora de fin debe ser posterior al inicio");
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAction({
        patient_id: String(form.get("patient_id")),
        doctor_id: String(form.get("doctor_id")),
        starts_at,
        ends_at,
        reason: String(form.get("reason") ?? "").trim() || null,
        notes: String(form.get("notes") ?? "").trim() || null,
        status: "scheduled",
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success("Cita agendada");
      router.push(`/agenda/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="patient_id">Paciente</Label>
        <select
          id="patient_id"
          name="patient_id"
          required
          disabled={pending}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Seleccionar…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.last_name}, {p.first_name} — {p.document_id}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="doctor_id">Médico</Label>
        <select
          id="doctor_id"
          name="doctor_id"
          required
          defaultValue={defaultDoctorId ?? ""}
          disabled={pending}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Seleccionar…</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" required disabled={pending} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="start_time">Inicio</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end_time">Fin</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            required
            disabled={pending}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Motivo</Label>
        <Input id="reason" name="reason" disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" disabled={pending} />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Agendando…" : "Agendar cita"}
        </Button>
        <Link href="/agenda" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
