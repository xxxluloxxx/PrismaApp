"use client";

import type { Treatment } from "@/lib/types/treatment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type QuoteLine = {
  key: string;
  treatment_id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

export function newQuoteLine(): QuoteLine {
  return {
    key: crypto.randomUUID(),
    treatment_id: "",
    description: "",
    quantity: 1,
    unit_price: 0,
  };
}

export function computeQuoteTotals(lines: QuoteLine[], taxRate: number) {
  const subtotal =
    Math.round(
      lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0) * 100
    ) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}

export function linesToItems(lines: QuoteLine[]) {
  return lines
    .filter((l) => l.description.trim() && l.quantity > 0)
    .map((l) => ({
      treatment_id: l.treatment_id || null,
      description: l.description.trim(),
      quantity: l.quantity,
      unit_price: l.unit_price,
    }));
}

export function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(n);
}

/**
 * Editor de líneas de presupuesto (agregar / quitar / editar tratamiento,
 * cantidad y precio unitario). Se usa tanto en la creación de un
 * presupuesto (quote-form.tsx) como en la edición de uno ya creado
 * (quote-detail.tsx, solo mientras no tenga pagos registrados).
 */
export function QuoteItemsEditor({
  lines,
  onLinesChange,
  treatments,
  disabled,
}: {
  lines: QuoteLine[];
  onLinesChange: (updater: (prev: QuoteLine[]) => QuoteLine[]) => void;
  treatments: Treatment[];
  disabled?: boolean;
}) {
  function setLine(key: string, patch: Partial<QuoteLine>) {
    onLinesChange((prev) =>
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Líneas</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onLinesChange((prev) => [...prev, newQuoteLine()])}
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
            <Select
              value={line.treatment_id || "__manual__"}
              onValueChange={(v) =>
                onTreatmentChange(line.key, !v || v === "__manual__" ? "" : v)
              }
              disabled={disabled}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue>
                  {(value: string) => {
                    if (value === "__manual__") return "Manual / elegir…";
                    const t = treatments.find((x) => x.id === value);
                    return t ? `${t.code} — ${t.name}` : value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__">Manual / elegir…</SelectItem>
                {treatments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-4">
            <Label>Descripción</Label>
            <Input
              value={line.description}
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled || lines.length === 1}
              onClick={() =>
                onLinesChange((prev) => prev.filter((l) => l.key !== line.key))
              }
            >
              Quitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
