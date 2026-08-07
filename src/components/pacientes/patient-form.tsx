"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createPatientAction,
  updatePatientAction,
} from "@/lib/patients/actions";
import type { Patient, PatientSex } from "@/lib/types/patient";
import { SEX_LABELS } from "@/lib/types/patient";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  patient?: Patient;
};

export function PatientForm({ patient }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(patient);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    const sexRaw = String(form.get("sex") ?? "");
    const sex = sexRaw === "" ? null : (sexRaw as PatientSex);

    const payload = {
      document_id: String(form.get("document_id") ?? "").trim(),
      first_name: String(form.get("first_name") ?? "").trim(),
      last_name: String(form.get("last_name") ?? "").trim(),
      birth_date: String(form.get("birth_date") ?? "").trim() || null,
      sex,
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
      emergency_contact_name:
        String(form.get("emergency_contact_name") ?? "").trim() || null,
      emergency_contact_phone:
        String(form.get("emergency_contact_phone") ?? "").trim() || null,
      notes: String(form.get("notes") ?? "").trim() || null,
    };

    if (
      !payload.document_id ||
      !payload.first_name ||
      !payload.last_name ||
      !payload.phone
    ) {
      setError("Identificación, nombres y teléfono son obligatorios");
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updatePatientAction(patient!.id, payload, patient!.updated_at)
        : await createPatientAction(payload);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(isEdit ? "Paciente actualizado" : "Paciente creado");
      router.push(`/pacientes/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="document_id">Identificación</Label>
          <Input
            id="document_id"
            name="document_id"
            required
            defaultValue={patient?.document_id ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_name">Nombres</Label>
          <Input
            id="first_name"
            name="first_name"
            required
            defaultValue={patient?.first_name ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last_name">Apellidos</Label>
          <Input
            id="last_name"
            name="last_name"
            required
            defaultValue={patient?.last_name ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="birth_date">Fecha de nacimiento</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={patient?.birth_date ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sex">Sexo</Label>
          <select
            id="sex"
            name="sex"
            defaultValue={patient?.sex ?? ""}
            disabled={pending}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {(Object.keys(SEX_LABELS) as PatientSex[]).map((key) => (
              <option key={key} value={key}>
                {SEX_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            required
            defaultValue={patient?.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={patient?.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            defaultValue={patient?.address ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergency_contact_name">Contacto de emergencia</Label>
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={patient?.emergency_contact_name ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="emergency_contact_phone">Tel. emergencia</Label>
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            defaultValue={patient?.emergency_contact_phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="notes">Notas administrativas</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={patient?.notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Crear paciente"}
        </Button>
        <Link
          href={patient ? `/pacientes/${patient.id}` : "/pacientes"}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
