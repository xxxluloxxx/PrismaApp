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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Line = {
  key: string;
  treatment_id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

function money(n: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

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
  const [lines, setLines] = useState<Line[]>([
    {
      key: crypto.randomUUID(),
      treatment_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
    },
  ]);

  const subtotal = useMemo(
    () =>
      Math.round(
        lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0) * 100
      ) / 100,
    [lines]
  );
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  function setLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function onTreatmentChange(key: string, treatmentId: string) {
    const t = treatments.find((x) => x.id === treatmentId);
    setLine(key, {
      treatment_id: treatmentId,
      description: t ? t.name : "",
      unit_price: t ? Number(t.price) : 0,
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const publish = String(form.get("intent")) === "publish";

    const items = lines
      .filter((l) => l.description.trim() && l.quantity > 0)
      .map((l) => ({
        treatment_id: l.treatment_id || null,
        description: l.description.trim(),
        quantity: l.quantity,
        unit_price: l.unit_price,
      }));

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
          <select
            id="patient_id"
            name="patient_id"
            required
            defaultValue={defaultPatientId ?? ""}
            disabled={pending}
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="doctor_id">Médico</Label>
          <select
            id="doctor_id"
            name="doctor_id"
            required
            defaultValue={defaultDoctorId ?? ""}
            disabled={pending}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Seleccionar…</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Líneas</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  key: crypto.randomUUID(),
                  treatment_id: "",
                  description: "",
                  quantity: 1,
                  unit_price: 0,
                },
              ])
            }
          >
            Agregar línea
          </Button>
        </div>

        {lines.map((line) => (
          <div
            key={line.key}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-12"
          >
            <div className="flex flex-col gap-1 sm:col-span-4">
              <Label>Tratamiento</Label>
              <select
                value={line.treatment_id}
                disabled={pending}
                onChange={(e) => onTreatmentChange(line.key, e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Manual / elegir…</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-4">
              <Label>Descripción</Label>
              <Input
                value={line.description}
                disabled={pending}
                onChange={(e) =>
                  setLine(line.key, { description: e.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-1">
              <Label>Cant.</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={line.quantity}
                disabled={pending}
                onChange={(e) =>
                  setLine(line.key, {
                    quantity: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Label>P. unitario</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.unit_price}
                disabled={pending}
                onChange={(e) =>
                  setLine(line.key, {
                    unit_price: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending || lines.length === 1}
                onClick={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
              >
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </div>

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
