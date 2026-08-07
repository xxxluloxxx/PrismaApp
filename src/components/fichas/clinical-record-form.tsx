"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createClinicalRecordAction } from "@/lib/clinical/actions";
import type { Patient } from "@/lib/types/patient";
import type { Profile } from "@/lib/types/profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ClinicalRecordForm({
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

    startTransition(async () => {
      const result = await createClinicalRecordAction({
        patient_id: String(form.get("patient_id")),
        doctor_id: String(form.get("doctor_id")),
        record_date: String(form.get("record_date") || new Date().toISOString().slice(0, 10)),
        chief_complaint: String(form.get("chief_complaint") ?? "").trim() || null,
        antecedents: String(form.get("antecedents") ?? "").trim() || null,
        allergies: String(form.get("allergies") ?? "").trim() || null,
        current_medications:
          String(form.get("current_medications") ?? "").trim() || null,
        diagnosis: String(form.get("diagnosis") ?? "").trim() || null,
        treatment_plan: String(form.get("treatment_plan") ?? "").trim() || null,
        observations: String(form.get("observations") ?? "").trim() || null,
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success("Ficha creada");
      router.push(`/fichas/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
                {p.last_name}, {p.first_name}
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
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="record_date">Fecha</Label>
          <Input
            id="record_date"
            name="record_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            disabled={pending}
          />
        </div>
      </div>

      {(
        [
          ["chief_complaint", "Motivo de consulta"],
          ["antecedents", "Antecedentes"],
          ["allergies", "Alergias"],
          ["current_medications", "Medicamentos actuales"],
          ["diagnosis", "Diagnóstico"],
          ["treatment_plan", "Plan de tratamiento"],
          ["observations", "Observaciones"],
        ] as const
      ).map(([name, label]) => (
        <div key={name} className="flex flex-col gap-2">
          <Label htmlFor={name}>{label}</Label>
          <Textarea id={name} name={name} rows={2} disabled={pending} />
        </div>
      ))}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Crear ficha"}
        </Button>
        <Link href="/fichas" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
