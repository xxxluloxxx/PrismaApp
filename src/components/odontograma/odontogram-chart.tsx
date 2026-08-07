"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertToothConditionAction } from "@/lib/odontogram/actions";
import type {
  OdontogramTooth,
  ToothCondition,
} from "@/lib/types/odontogram";
import {
  FDI_ADULT_LOWER,
  FDI_ADULT_UPPER,
  TOOTH_CONDITION_COLORS,
  TOOTH_CONDITION_LABELS,
} from "@/lib/types/odontogram";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CONDITIONS = Object.keys(TOOTH_CONDITION_LABELS) as ToothCondition[];

export function OdontogramChart({
  odontogramId,
  initialTeeth,
}: {
  odontogramId: string;
  initialTeeth: OdontogramTooth[];
}) {
  const [pending, startTransition] = useTransition();
  const [teeth, setTeeth] = useState<Record<string, ToothCondition>>(() => {
    const map: Record<string, ToothCondition> = {};
    for (const t of initialTeeth) {
      map[t.tooth_code] = t.condition;
    }
    return map;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [condition, setCondition] = useState<ToothCondition>("caries");

  const selectedLabel = useMemo(
    () => (selected ? `Pieza ${selected}` : "Ninguna seleccionada"),
    [selected]
  );

  function saveTooth() {
    if (!selected) {
      toast.error("Selecciona una pieza");
      return;
    }

    startTransition(async () => {
      const result = await upsertToothConditionAction({
        odontogram_id: odontogramId,
        tooth_code: selected,
        condition,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTeeth((prev) => ({ ...prev, [selected]: condition }));
      toast.success(`Pieza ${selected} actualizada`);
    });
  }

  function renderRow(codes: readonly string[], midAt: number) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {codes.map((code, index) => {
          const current = teeth[code];
          const isSelected = selected === code;
          return (
            <div key={code} className="contents">
              {index === midAt ? (
                <span
                  aria-hidden
                  className="mx-1 hidden h-8 w-px bg-border sm:block"
                />
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setSelected(code);
                  if (current) setCondition(current);
                }}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border text-xs font-medium transition-colors sm:size-10",
                  current
                    ? TOOTH_CONDITION_COLORS[current]
                    : "border-border bg-background hover:bg-muted",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
                title={
                  current
                    ? `${code}: ${TOOTH_CONDITION_LABELS[current]}`
                    : `Pieza ${code}`
                }
              >
                {code}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-wide">
          Superior
        </p>
        {renderRow(FDI_ADULT_UPPER, 8)}
        <div className="my-1 border-t border-dashed" />
        <p className="text-center text-xs text-muted-foreground uppercase tracking-wide">
          Inferior
        </p>
        {renderRow(FDI_ADULT_LOWER, 8)}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Pieza seleccionada</Label>
          <p className="text-sm font-medium">{selectedLabel}</p>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="condition">Condición</Label>
          <select
            id="condition"
            value={condition}
            disabled={pending}
            onChange={(e) => setCondition(e.target.value as ToothCondition)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {TOOTH_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" disabled={pending || !selected} onClick={saveTooth}>
          {pending ? "Guardando…" : "Guardar pieza"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONDITIONS.map((c) => (
          <span
            key={c}
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs",
              TOOTH_CONDITION_COLORS[c]
            )}
          >
            {TOOTH_CONDITION_LABELS[c]}
          </span>
        ))}
      </div>
    </div>
  );
}
