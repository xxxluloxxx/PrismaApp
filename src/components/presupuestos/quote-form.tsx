"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { createQuoteAction } from "@/lib/quotes/actions";
import type { Patient } from "@/lib/types/patient";
import type { Profile } from "@/lib/types/profile";
import type { Treatment } from "@/lib/types/treatment";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  computeQuoteTotals,
  linesToItems,
  money,
  newQuoteLine,
  QuoteItemsEditor,
  type QuoteLine as Line,
} from "@/components/presupuestos/quote-items-editor";

export function QuoteForm({
  patients,
  doctors,
  treatments,
  taxRate,
  defaultDoctorId,
  defaultPatientId,
}: {
  patients: Patient[];
  doctors: Profile[];
  treatments: Treatment[];
  taxRate: number;
  defaultDoctorId?: string;
  defaultPatientId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([newQuoteLine()]);

  const { subtotal, taxAmount, total } = useMemo(
    () => computeQuoteTotals(lines, taxRate),
    [lines, taxRate]
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const publish = String(form.get("intent")) === "publish";

    const items = linesToItems(lines);

    if (!items.length) {
      setError("Agrega al menos una línea válida");
      return;
    }

    startTransition(async () => {
      const result = await createQuoteAction({
        patient_id: String(form.get("patient_id")),
        doctor_id: String(form.get("doctor_id")),
        issue_date: String(form.get("issue_date") || ""),
        notes: String(form.get("notes") ?? "").trim() || null,
        items,
        publish,
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(publish ? "Presupuesto emitido" : "Borrador guardado");
      router.push(`/presupuestos/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="patient_id">Paciente</Label>
          <Select
            name="patient_id"
            required
            defaultValue={defaultPatientId}
            disabled={pending}
          >
            <SelectTrigger id="patient_id" size="sm" className="w-full">
              <SelectValue placeholder="Seleccionar…">
                {(value: string) => {
                  const p = patients.find((x) => x.id === value);
                  return p ? `${p.last_name}, ${p.first_name}` : value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name}
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="issue_date">Fecha</Label>
          <Input
            id="issue_date"
            name="issue_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            disabled={pending}
          />
        </div>
      </div>

      <QuoteItemsEditor
        lines={lines}
        onLinesChange={setLines}
        treatments={treatments}
        disabled={pending}
      />

      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-muted-foreground">
          <span>IVA ({(taxRate * 100).toFixed(0)}%)</span>
          <span>{money(taxAmount)}</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" disabled={pending} rows={3} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar borrador"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          variant="secondary"
          disabled={pending}
        >
          Emitir (pendiente)
        </Button>
        <Link
          href="/presupuestos"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
