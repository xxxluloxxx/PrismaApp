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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ClinicalRecordForm({
  patients,
  doctors,
  defaultDoctorId,
  defaultPatientId,
}: {
  patients: Patient[];
  doctors: Profile[];
  defaultDoctorId?: string;
  defaultPatientId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!patientId) {
      setError("Selecciona un paciente");
      toast.error("Selecciona un paciente");
      return;
    }
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createClinicalRecordAction({
        patient_id: patientId,
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
          <Select
            name="patient_id"
            required
            value={patientId || undefined}
            onValueChange={(v) => setPatientId(v ?? "")}
            disabled={pending}
          >
            <SelectTrigger id="patient_id" size="sm" className="w-full">
              <SelectValue placeholder="Seleccionar…">
                {(value: string) => {
                  const p = patients.find((x) => x.id === value);
                  return p ? `${p.first_name} ${p.last_name}` : value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="doctor_id">Médico</Label>
          <Select
            name="doctor_id"
            required
            defaultValue={defaultDoctorId}
            disabled={pending}
          >
            <SelectTrigger id="doctor_id" size="sm" className="w-full">
              <SelectValue placeholder="Seleccionar…">
                {(value: string) => {
                  const d = doctors.find((x) => x.id === value);
                  return d ? d.full_name : value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
