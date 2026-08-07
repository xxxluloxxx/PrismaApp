import Link from "next/link";

import type { ClinicalRecordWithNames } from "@/lib/types/clinical";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClinicalRecordsList({
  records,
}: {
  records: ClinicalRecordWithNames[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Fichas clínicas
          </h1>
          <p className="text-sm text-muted-foreground">
            Historia clínica enriquecida por visita
          </p>
        </div>
        <Link href="/fichas/nueva" className={cn(buttonVariants())}>
          Nueva ficha
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin fichas
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/fichas/${r.id}`} className="font-medium hover:underline">
                      {r.record_date}
                    </Link>
                  </TableCell>
                  <TableCell>{r.patient_name}</TableCell>
                  <TableCell>{r.doctor_name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {r.chief_complaint || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
