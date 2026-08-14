export type ToothCondition =
  | "sano"
  | "caries"
  | "obturacion"
  | "corona"
  | "endodoncia"
  | "ausente"
  | "extraccion_indicada"
  | "implante"
  | "protesis"
  | "fractura"
  | "sellante"
  | "otro";

export type ChartType = "adulto" | "pediatrico";

/**
 * Cara dental. 'total' es una pseudo-superficie usada para condiciones que
 * aplican a toda la pieza (ausente, extraccion_indicada, implante, protesis)
 * en vez de a una cara específica.
 */
export type ToothSurface = "M" | "D" | "O" | "V" | "L" | "total";

/** Condiciones que sólo tiene sentido aplicar a la pieza completa. */
export const WHOLE_TOOTH_CONDITIONS: ReadonlySet<ToothCondition> = new Set([
  "ausente",
  "extraccion_indicada",
  "implante",
  "protesis",
]);

export const TOOTH_SURFACE_LABELS: Record<ToothSurface, string> = {
  M: "Mesial",
  D: "Distal",
  O: "Oclusal / Incisal",
  V: "Vestibular",
  L: "Lingual / Palatino",
  total: "Toda la pieza",
};

export type Odontogram = {
  id: string;
  patient_id: string;
  clinical_record_id: string | null;
  chart_type: ChartType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OdontogramTooth = {
  id: string;
  odontogram_id: string;
  tooth_code: string;
  surface: ToothSurface;
  condition: ToothCondition;
  notes: string | null;
};

export type OdontogramWithNames = Odontogram & {
  patient_name: string;
  teeth?: OdontogramTooth[];
};

export const TOOTH_CONDITION_LABELS: Record<ToothCondition, string> = {
  sano: "Sano",
  caries: "Caries",
  obturacion: "Obturación",
  corona: "Corona",
  endodoncia: "Endodoncia",
  ausente: "Ausente",
  extraccion_indicada: "Extracción indicada",
  implante: "Implante",
  protesis: "Prótesis",
  fractura: "Fractura",
  sellante: "Sellante",
  otro: "Otro",
};

export const TOOTH_CONDITION_COLORS: Record<ToothCondition, string> = {
  sano: "bg-emerald-100 text-emerald-900 border-emerald-300",
  caries: "bg-red-100 text-red-900 border-red-300",
  obturacion: "bg-sky-100 text-sky-900 border-sky-300",
  corona: "bg-amber-100 text-amber-900 border-amber-300",
  endodoncia: "bg-violet-100 text-violet-900 border-violet-300",
  ausente: "bg-zinc-200 text-zinc-600 border-zinc-400 line-through",
  extraccion_indicada: "bg-orange-100 text-orange-900 border-orange-300",
  implante: "bg-teal-100 text-teal-900 border-teal-300",
  protesis: "bg-indigo-100 text-indigo-900 border-indigo-300",
  fractura: "bg-rose-100 text-rose-900 border-rose-300",
  sellante: "bg-lime-100 text-lime-900 border-lime-300",
  otro: "bg-muted text-foreground border-border",
};

/**
 * Colores hex por condición para rellenos de SVG (las regiones del
 * odontograma). Alineados con TOOTH_CONDITION_COLORS pero en formato
 * fill/stroke utilizables directamente en atributos SVG.
 */
export const TOOTH_CONDITION_FILL: Record<
  ToothCondition,
  { fill: string; stroke: string }
> = {
  sano: { fill: "#d1fae5", stroke: "#6ee7b7" },
  caries: { fill: "#fecaca", stroke: "#f87171" },
  obturacion: { fill: "#bae6fd", stroke: "#38bdf8" },
  corona: { fill: "#fde68a", stroke: "#fbbf24" },
  endodoncia: { fill: "#ddd6fe", stroke: "#a78bfa" },
  ausente: { fill: "#d4d4d8", stroke: "#a1a1aa" },
  extraccion_indicada: { fill: "#fed7aa", stroke: "#fb923c" },
  implante: { fill: "#99f6e4", stroke: "#2dd4bf" },
  protesis: { fill: "#c7d2fe", stroke: "#818cf8" },
  fractura: { fill: "#fecdd3", stroke: "#fb7185" },
  sellante: { fill: "#d9f99d", stroke: "#a3e635" },
  otro: { fill: "#e4e4e7", stroke: "#a1a1aa" },
};

/** Relleno/borde neutro para una cara sin condición registrada. */
export const TOOTH_SURFACE_EMPTY_FILL = { fill: "#f8fafc", stroke: "#cbd5e1" };

/** FDI adult permanent dentition, display order per quadrant row. */
export const FDI_ADULT_UPPER = [
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
] as const;

export const FDI_ADULT_LOWER = [
  "48",
  "47",
  "46",
  "45",
  "44",
  "43",
  "42",
  "41",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
] as const;

export const FDI_ADULT_ALL = [...FDI_ADULT_UPPER, ...FDI_ADULT_LOWER] as const;
