"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createOdontogramAction } from "@/lib/odontogram/actions";
import type { OdontogramWithNames } from "@/lib/types/odontogram";
import type { Patient } from "@/lib/types/patient";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function OdontogramsHome({
  patients,
  recent,
  defaultPatientId,
}: {
  patients: Patient[];
  recent: OdontogramWithNames[];
  defaultPatientId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [cloneLast, setCloneLast] = useState(true);

  function createChart() {
    if (!patientId) {
      toast.error("Selecciona un paciente");
      return;
    }
    startTransition(async () => {
      const result = await createOdontogramAction({
        patient_id: patientId,
        clone_last: cloneLast,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Odontograma creado");
      router.push(`/odontograma/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Odontograma
          </h1>
          <p className="text-sm text-muted-foreground">
            Chart dental FDI por paciente (adulto)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="patient_id">Paciente</Label>
          <select
            id="patient_id"
            value={patientId}
            disabled={pending}
            onChange={(e) => setPatientId(e.target.value)}
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cloneLast}
            disabled={pending}
            onChange={(e) => setCloneLast(e.target.checked)}
          />
          Clonar último odontograma
        </label>
        <Button type="button" disabled={pending} onClick={createChart}>
          {pending ? "Creando…" : "Abrir chart nuevo"}
        </Button>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-xl font-semibold">Recientes</h2>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Sin odontogramas
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      {new Date(o.created_at).toLocaleString("es-EC")}
                    </TableCell>
                    <TableCell>{o.patient_name}</TableCell>
                    <TableCell className="capitalize">{o.chart_type}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/odontograma/${o.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Abrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
