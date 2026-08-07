"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createPaymentAction } from "@/lib/payments/actions";
import { updateQuoteStatusAction } from "@/lib/quotes/actions";
import type { Payment, QuoteWithNames } from "@/lib/types/quote";
import {
  PAYMENT_METHOD_LABELS,
  QUOTE_STATUS_LABELS,
  type PaymentMethod,
} from "@/lib/types/quote";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(n);
}

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

export function QuoteDetail({
  quote,
  payments,
}: {
  quote: QuoteWithNames;
  payments: Payment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");

  const paid = quote.paid_amount ?? 0;
  const balance = Math.round((quote.total - paid) * 100) / 100;
  const canPay =
    quote.status !== "draft" &&
    quote.status !== "cancelled" &&
    quote.status !== "paid" &&
    balance > 0;

  function changeStatus(status: "pending" | "cancelled") {
    startTransition(async () => {
      const result = await updateQuoteStatusAction(quote.id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        status === "pending" ? "Presupuesto emitido" : "Presupuesto cancelado"
      );
      router.refresh();
    });
  }

  function recordPayment(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    startTransition(async () => {
      const result = await createPaymentAction({
        quote_id: quote.id,
        amount: value,
        method,
        reference: reference.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Pago registrado");
      setAmount("");
      setReference("");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Presupuesto
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quote.patient_name} · {quote.issue_date}
          </p>
          <div className="mt-2">
            <Badge variant="secondary">
              {QUOTE_STATUS_LABELS[quote.status]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quote.status === "draft" ? (
            <Button
              disabled={pending}
              onClick={() => changeStatus("pending")}
            >
              Emitir
            </Button>
          ) : null}
          {quote.status === "draft" || quote.status === "pending" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => changeStatus("cancelled")}
            >
              Cancelar
            </Button>
          ) : null}
          <Link
            href="/presupuestos"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Volver
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Médico</p>
            <p className="font-medium">{quote.doctor_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Moneda</p>
            <p className="font-medium">{quote.currency}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Subtotal</p>
            <p className="font-medium">{money(quote.subtotal, quote.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              IVA ({(quote.tax_rate * 100).toFixed(0)}%)
            </p>
            <p className="font-medium">
              {money(quote.tax_amount, quote.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">{money(quote.total, quote.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pagado / Saldo</p>
            <p className="font-medium">
              {money(paid, quote.currency)} / {money(balance, quote.currency)}
            </p>
          </div>
          {quote.notes ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Notas</p>
              <p className="font-medium whitespace-pre-wrap">{quote.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-heading text-xl font-semibold">Líneas</h2>
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(quote.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Sin líneas
                  </TableCell>
                </TableRow>
              ) : (
                (quote.items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {money(item.unit_price, quote.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {money(item.line_total, quote.currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-xl font-semibold">Pagos</h2>
        {canPay ? (
          <form
            onSubmit={recordPayment}
            className="mb-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                min={0.01}
                step={0.01}
                max={balance}
                required
                value={amount}
                disabled={pending}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={balance.toFixed(2)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="method">Método</Label>
              <select
                id="method"
                value={method}
                disabled={pending}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={reference}
                disabled={pending}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Registrando…" : "Registrar pago"}
              </Button>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Sin pagos
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.paid_at).toLocaleString("es-EC")}
                    </TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[p.method]}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                    <TableCell className="text-right">
                      {money(p.amount, quote.currency)}
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
