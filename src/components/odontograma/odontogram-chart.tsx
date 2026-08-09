"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertToothConditionAction } from "@/lib/odontogram/actions";
import type {
  OdontogramTooth,
  ToothCondition,
  ToothSurface,
} from "@/lib/types/odontogram";
import {
  FDI_ADULT_LOWER,
  FDI_ADULT_UPPER,
  TOOTH_CONDITION_COLORS,
  TOOTH_CONDITION_LABELS,
  TOOTH_SURFACE_LABELS,
  WHOLE_TOOTH_CONDITIONS,
} from "@/lib/types/odontogram";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ToothDiagram } from "@/components/odontograma/tooth-diagram";

const CONDITIONS = Object.keys(TOOTH_CONDITION_LABELS) as ToothCondition[];

type TeethMap = Record<string, Partial<Record<ToothSurface, ToothCondition>>>;

function buildTeethMap(rows: OdontogramTooth[]): TeethMap {
  const map: TeethMap = {};
  for (const row of rows) {
    if (!map[row.tooth_code]) map[row.tooth_code] = {};
    map[row.tooth_code][row.surface] = row.condition;
  }
  return map;
}

export function OdontogramChart({
  odontogramId,
  initialTeeth,
}: {
  odontogramId: string;
  initialTeeth: OdontogramTooth[];
}) {
  const [pending, startTransition] = useTransition();
  const [teeth, setTeeth] = useState<TeethMap>(() => buildTeethMap(initialTeeth));
  const [selected, setSelected] = useState<{
    code: string;
    surface: ToothSurface;
  } | null>(null);
  const [condition, setCondition] = useState<ToothCondition>("caries");

  const selectedLabel = useMemo(() => {
    if (!selected) return "Ninguna seleccionada";
    return `Pieza ${selected.code} — ${TOOTH_SURFACE_LABELS[selected.surface]}`;
  }, [selected]);

  function selectSurface(code: string, surface: ToothSurface) {
    setSelected({ code, surface });
    const current = teeth[code]?.[surface];
    if (current) {
      setCondition(current);
    } else if (surface === "total") {
      setCondition("ausente");
    } else {
      setCondition("caries");
    }
  }

  function saveTooth() {
    if (!selected) {
      toast.error("Selecciona una cara de la pieza");
      return;
    }
    if (selected.surface === "total" && !WHOLE_TOOTH_CONDITIONS.has(condition)) {
      toast.error(
        "Esa condición no aplica a toda la pieza; elige una cara específica"
      );
      return;
    }
    if (selected.surface !== "total" && WHOLE_TOOTH_CONDITIONS.has(condition)) {
      toast.error(
        'Esa condición aplica a toda la pieza; usa el botón "▢" de la pieza'
      );
      return;
    }

    const { code, surface } = selected;
    startTransition(async () => {
      const result = await upsertToothConditionAction({
        odontogram_id: odontogramId,
        tooth_code: code,
        surface,
        condition,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTeeth((prev) => ({
        ...prev,
        [code]: { ...prev[code], [surface]: condition },
      }));
      toast.success(`Pieza ${code} (${TOOTH_SURFACE_LABELS[surface]}) actualizada`);
    });
  }

  function renderRow(codes: readonly string[], arch: "upper" | "lower", midAt: number) {
    return (
      <div className="flex flex-wrap items-end justify-center gap-1.5">
        {codes.map((code, index) => (
          <div key={code} className="contents">
            {index === midAt ? (
              <span
                aria-hidden
                className="mx-1 hidden h-10 w-px self-center bg-border sm:block"
              />
            ) : null}
            <ToothDiagram
              code={code}
              arch={arch}
              faces={teeth[code] ?? {}}
              disabled={pending}
              selectedSurface={selected?.code === code ? selected.surface : null}
              onSelectSurface={(surface) => selectSurface(code, surface)}
              onSelectWhole={() => selectSurface(code, "total")}
            />
          </div>
        ))}
      </div>
    );
  }

  const availableConditions =
    selected?.surface === "total"
      ? CONDITIONS.filter((c) => WHOLE_TOOTH_CONDITIONS.has(c))
      : CONDITIONS.filter((c) => !WHOLE_TOOTH_CONDITIONS.has(c));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-wide">
          Superior
        </p>
        {renderRow(FDI_ADULT_UPPER, "upper", 8)}
        <div className="my-1 border-t border-dashed" />
        {renderRow(FDI_ADULT_LOWER, "lower", 8)}
        <p className="text-center text-xs text-muted-foreground uppercase tracking-wide">
          Inferior
        </p>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Toca una cara de la pieza (mesial, distal, oclusal, vestibular o
        lingual) para registrar una condición. Usa el botón{" "}
        <span className="font-medium">▢</span> en la esquina de la pieza para
        condiciones de toda la pieza (ausente, implante, prótesis, etc.).
      </p>

      <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Selección</Label>
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
            {availableConditions.map((c) => (
              <option key={c} value={c}>
                {TOOTH_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" disabled={pending || !selected} onClick={saveTooth}>
          {pending ? "Guardando…" : "Guardar cara"}
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
