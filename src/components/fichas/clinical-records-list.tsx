"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ClinicalRecordWithNames } from "@/lib/types/clinical";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  patientId,
}: {
  records: ClinicalRecordWithNames[];
  patientId?: string;
}) {
  const router = useRouter();
  const nuevaHref = patientId
    ? `/fichas/nueva?patient=${patientId}`
    : "/fichas/nueva";
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
        <Link href={nuevaHref} className={cn(buttonVariants())}>
          Nueva ficha
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          Sin fichas
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {records.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer"
                onClick={() => router.push(`/fichas/${r.id}`)}
              >
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{r.patient_name}</span>
                    <span className="text-sm text-muted-foreground">{r.record_date}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{r.doctor_name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {r.chief_complaint || "—"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border sm:block">
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
                {records.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/fichas/${r.id}`)}
                  >
                    <TableCell>
                      <Link
                        href={`/fichas/${r.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.record_date}
                      </Link>
                    </TableCell>
                    <TableCell>{r.patient_name}</TableCell>
                    <TableCell>{r.doctor_name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {r.chief_complaint || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
