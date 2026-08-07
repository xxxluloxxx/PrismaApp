"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setPatientActiveAction } from "@/lib/patients/actions";
import type { Patient } from "@/lib/types/patient";
import { SEX_LABELS } from "@/lib/types/patient";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PatientDetail({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setPatientActiveAction(
        patient.id,
        !patient.is_active,
        patient.updated_at
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        patient.is_active ? "Paciente desactivado" : "Paciente reactivado"
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CI/Doc: {patient.document_id}
          </p>
          <div className="mt-2">
            <Badge variant={patient.is_active ? "secondary" : "outline"}>
              {patient.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pacientes/${patient.id}/editar`}
            className={cn(buttonVariants())}
          >
            Editar
          </Link>
          <Link
            href={`/odontograma?patient=${patient.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Odontograma
          </Link>
          <Link
            href={`/presupuestos/nuevo?patient=${patient.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Presupuesto
          </Link>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => toggleActive()}
          >
            {patient.is_active ? "Desactivar" : "Reactivar"}
          </Button>
          <Link
            href="/pacientes"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Volver
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Teléfono</p>
            <p className="font-medium">{patient.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{patient.email || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Dirección</p>
            <p className="font-medium">{patient.address || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nacimiento</p>
            <p className="font-medium">{patient.birth_date || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sexo</p>
            <p className="font-medium">
              {patient.sex ? SEX_LABELS[patient.sex] : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Contacto emergencia</p>
            <p className="font-medium">
              {patient.emergency_contact_name || "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tel. emergencia</p>
            <p className="font-medium">
              {patient.emergency_contact_phone || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Notas</p>
            <p className="font-medium whitespace-pre-wrap">
              {patient.notes || "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
