"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useRealtimeRefresh } from "@/lib/supabase/realtime";
import type { DailyCashCut } from "@/lib/supabase/payment";
import type { Patient } from "@/lib/types/patient";
import type { Profile } from "@/lib/types/profile";
import type {
  PaymentMethod,
  PaymentWithContext,
  QuoteStatus,
} from "@/lib/types/quote";
import {
  PAYMENT_METHOD_LABELS,
  QUOTE_STATUS_LABELS,
} from "@/lib/types/quote";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL = "all";
const METHOD_KEYS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(n);
}

function formatPaidAt(iso: string) {
  return new Date(iso).toLocaleString("es-EC");
}

function quoteStatusLabel(status: string) {
  return QUOTE_STATUS_LABELS[status as QuoteStatus] ?? status;
}

export function PaymentsList({
  payments,
  patients,
  doctors,
  cashCut,
  filters,
}: {
  payments: PaymentWithContext[];
  patients: Patient[];
  doctors: Profile[];
  cashCut: DailyCashCut | null;
  filters: {
    dateFrom: string;
    dateTo: string;
    patientId: string;
    doctorId: string;
    method: string;
  };
}) {
  useRealtimeRefresh("payments");
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasFilters = Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      filters.patientId ||
      filters.doctorId ||
      filters.method
  );

  function pushParams(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/cobranzas?${qs}` : "/cobranzas");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Cobranzas
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos los cobros de la clínica, con corte de caja del día
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Corte de caja del día
          {cashCut ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {cashCut.date}
            </span>
          ) : null}
        </h2>
        {cashCut ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xl font-semibold tabular-nums">
                  {money(cashCut.total)}
                </span>
              </CardContent>
            </Card>
            {METHOD_KEYS.map((method) => (
              <Card key={method}>
                <CardContent className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                  <span className="text-lg font-medium tabular-nums">
                    {money(cashCut.byMethod[method])}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border p-3 text-sm text-muted-foreground">
            No se pudo calcular el corte de caja del día.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          type="date"
          aria-label="Desde"
          value={filters.dateFrom}
          onChange={(e) => pushParams({ dateFrom: e.target.value })}
          className="w-full sm:w-auto"
        />
        <Input
          type="date"
          aria-label="Hasta"
          value={filters.dateTo}
          onChange={(e) => pushParams({ dateTo: e.target.value })}
          className="w-full sm:w-auto"
        />
        <Select
          value={filters.patientId || ALL}
          onValueChange={(v) =>
            pushParams({ patientId: !v || v === ALL ? "" : v })
          }
        >
          <SelectTrigger size="sm" className="w-full sm:w-56">
            <SelectValue placeholder="Paciente">
              {(value: string) => {
                if (!value || value === ALL) return "Todos los pacientes";
                const p = patients.find((x) => x.id === value);
                return p ? `${p.first_name} ${p.last_name}` : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los pacientes</SelectItem>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.doctorId || ALL}
          onValueChange={(v) =>
            pushParams({ doctorId: !v || v === ALL ? "" : v })
          }
        >
          <SelectTrigger size="sm" className="w-full sm:w-48">
            <SelectValue placeholder="Médico">
              {(value: string) => {
                if (!value || value === ALL) return "Todos los médicos";
                const d = doctors.find((x) => x.id === value);
                return d ? d.full_name : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.method || ALL}
          onValueChange={(v) =>
            pushParams({ method: !v || v === ALL ? "" : v })
          }
        >
          <SelectTrigger size="sm" className="w-full sm:w-44">
            <SelectValue placeholder="Método">
              {(value: string) => {
                if (!value || value === ALL) return "Todos los métodos";
                return (
                  PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? value
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los métodos</SelectItem>
            {METHOD_KEYS.map((method) => (
              <SelectItem key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          {hasFilters
            ? "Sin cobros con los filtros aplicados"
            : "Sin cobros"}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{p.patient_name}</span>
                    <Badge variant="secondary">
                      {PAYMENT_METHOD_LABELS[p.method]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {p.doctor_name}
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/presupuestos/${p.quote_id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {formatPaidAt(p.paid_at)}
                    </Link>
                    <span className="font-medium">{money(p.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Ref. {p.reference ?? "—"}</span>
                    <span>{quoteStatusLabel(p.quote_status)}</span>
                  </div>
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
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/presupuestos/${p.quote_id}`)}
                  >
                    <TableCell>{formatPaidAt(p.paid_at)}</TableCell>
                    <TableCell>{p.patient_name}</TableCell>
                    <TableCell>{p.doctor_name}</TableCell>
                    <TableCell>
                      <Link
                        href={`/presupuestos/${p.quote_id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {quoteStatusLabel(p.quote_status)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PAYMENT_METHOD_LABELS[p.method]}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.reference ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {money(p.amount)}
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
