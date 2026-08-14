"use client";

import Link from "next/link";
import { useState } from "react";

import { useRealtimeRefresh } from "@/lib/supabase/realtime";
import type { QuoteWithNames } from "@/lib/types/quote";
import { QUOTE_STATUS_LABELS } from "@/lib/types/quote";
import { Badge } from "@/components/ui/badge";
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

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(n);
}

export function QuotesList({ quotes }: { quotes: QuoteWithNames[] }) {
  useRealtimeRefresh("quotes");
  useRealtimeRefresh("payments");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Presupuestos
          </h1>
          <p className="text-sm text-muted-foreground">
            Proformas con IVA congelado y líneas persistidas
          </p>
        </div>
        <Link href="/presupuestos/nuevo" className={cn(buttonVariants())}>
          Nuevo presupuesto
        </Link>
      </div>

      {quotes.length === 0 ? (
        <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          Sin presupuestos
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {quotes.map((q) => (
              <Card
                key={q.id}
                className="cursor-pointer"
                onClick={() =>
                  setExpanded((prev) => (prev === q.id ? null : q.id))
                }
              >
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{q.patient_name}</span>
                    <Badge variant="secondary">
                      {QUOTE_STATUS_LABELS[q.status]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{q.doctor_name}</span>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/presupuestos/${q.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {q.issue_date}
                    </Link>
                    <span className="font-medium">{money(q.total, q.currency)}</span>
                  </div>
                  {expanded === q.id ? (
                    <p className="text-xs text-muted-foreground">
                      Subtotal {money(q.subtotal, q.currency)} · IVA{" "}
                      {(q.tax_rate * 100).toFixed(0)}%
                    </p>
                  ) : null}
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpanded((prev) => (prev === q.id ? null : q.id))
                    }
                  >
                    <TableCell>
                      <Link
                        href={`/presupuestos/${q.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {q.issue_date}
                      </Link>
                    </TableCell>
                    <TableCell>{q.patient_name}</TableCell>
                    <TableCell>{q.doctor_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {QUOTE_STATUS_LABELS[q.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {money(q.total, q.currency)}
                      {expanded === q.id ? (
                        <p className="mt-1 text-xs font-normal text-muted-foreground">
                          Subtotal {money(q.subtotal, q.currency)} · IVA{" "}
                          {(q.tax_rate * 100).toFixed(0)}%
                        </p>
                      ) : null}
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
