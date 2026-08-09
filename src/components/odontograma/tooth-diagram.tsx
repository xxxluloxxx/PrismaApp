"use client";

import type { ToothCondition, ToothSurface } from "@/lib/types/odontogram";
import {
  TOOTH_CONDITION_FILL,
  TOOTH_SURFACE_EMPTY_FILL,
} from "@/lib/types/odontogram";
import { cn } from "@/lib/utils";

/**
 * Puntos de los 5 polígonos que dividen una pieza dental en sus caras,
 * sobre un viewBox 0 0 100 100:
 *  - cuadrado exterior con esquinas (0,0) (100,0) (100,100) (0,100)
 *  - cuadrado interior (oclusal/incisal) con esquinas (30,30) (70,30) (70,70) (30,70)
 *  - 4 trapecios conectando cada lado exterior con el interior.
 */
const REGION_POINTS: Record<"top" | "bottom" | "left" | "right" | "center", string> = {
  top: "0,0 100,0 70,30 30,30",
  bottom: "0,100 100,100 70,70 30,70",
  left: "0,0 0,100 30,70 30,30",
  right: "100,0 100,100 70,70 70,30",
  center: "30,30 70,30 70,70 30,70",
};

/**
 * Convención elegida (decisión de diseño, no confirmada con el usuario):
 * en piezas del arco superior, el trapecio de arriba es Vestibular y el de
 * abajo es Lingual/Palatino (la vestibular mira "hacia afuera" del gráfico,
 * como en un odontograma impreso clásico); en el arco inferior se invierte.
 * Izquierda = Mesial, derecha = Distal para ambos arcos (simplificación:
 * no se distingue lado de arcada izquierda/derecha del paciente).
 */
function regionToSurface(
  region: "top" | "bottom" | "left" | "right" | "center",
  arch: "upper" | "lower"
): ToothSurface {
  if (region === "center") return "O";
  if (region === "left") return "M";
  if (region === "right") return "D";
  if (region === "top") return arch === "upper" ? "V" : "L";
  return arch === "upper" ? "L" : "V";
}

export function ToothDiagram({
  code,
  arch,
  faces,
  selectedSurface,
  disabled,
  onSelectSurface,
  onSelectWhole,
}: {
  code: string;
  arch: "upper" | "lower";
  faces: Partial<Record<ToothSurface, ToothCondition>>;
  selectedSurface: ToothSurface | null;
  disabled?: boolean;
  onSelectSurface: (surface: ToothSurface) => void;
  onSelectWhole: () => void;
}) {
  const wholeCondition = faces.total;
  const wholeStyle = wholeCondition
    ? TOOTH_CONDITION_FILL[wholeCondition]
    : null;
  const patternId = `tooth-hatch-${code}`;

  return (
    <div className="group relative flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-medium text-muted-foreground leading-none">
        {code}
      </span>
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          className="size-9 overflow-visible sm:size-11"
          role="group"
          aria-label={`Pieza ${code}`}
        >
          {wholeStyle ? (
            <defs>
              <pattern
                id={patternId}
                width="10"
                height="10"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <rect width="10" height="10" fill={wholeStyle.fill} opacity={0.55} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke={wholeStyle.stroke}
                  strokeWidth="4"
                />
              </pattern>
            </defs>
          ) : null}

          {(["top", "left", "right", "bottom", "center"] as const).map(
            (region) => {
              const surface = regionToSurface(region, arch);
              const condition = faces[surface];
              const style = condition
                ? TOOTH_CONDITION_FILL[condition]
                : TOOTH_SURFACE_EMPTY_FILL;
              const isSelected =
                selectedSurface === surface && !wholeCondition;
              return (
                <polygon
                  key={region}
                  points={REGION_POINTS[region]}
                  fill={style.fill}
                  stroke={isSelected ? "var(--primary)" : style.stroke}
                  strokeWidth={isSelected ? 4 : 1.5}
                  strokeLinejoin="round"
                  className={cn(
                    "cursor-pointer transition-opacity",
                    disabled ? "pointer-events-none opacity-60" : "hover:opacity-80"
                  )}
                  onClick={() => onSelectSurface(surface)}
                >
                  <title>
                    {code} · {surface === "total" ? "Toda la pieza" : surface}
                  </title>
                </polygon>
              );
            }
          )}

          {wholeStyle ? (
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={`url(#${patternId})`}
              stroke={
                selectedSurface === "total" ? "var(--primary)" : wholeStyle.stroke
              }
              strokeWidth={selectedSurface === "total" ? 5 : 3}
              className="pointer-events-none"
            />
          ) : null}
        </svg>

        <button
          type="button"
          disabled={disabled}
          onClick={onSelectWhole}
          title="Aplicar condición a toda la pieza"
          aria-label={`Pieza ${code}: aplicar condición a toda la pieza`}
          className={cn(
            "absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full border border-border bg-background text-[7px] leading-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:size-4",
            selectedSurface === "total" && "border-primary text-primary opacity-100"
          )}
        >
          ▢
        </button>
      </div>
    </div>
  );
}
