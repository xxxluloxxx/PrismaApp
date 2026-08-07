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
  surfaces: string[];
  condition: ToothCondition;
  notes: string | null;
};

export type OdontogramWithNames = Odontogram & {
  patient_name: string;
  teeth?: OdontogramTooth[];
};

export type OdontogramInsert = {
  patient_id: string;
  clinical_record_id?: string | null;
  chart_type?: ChartType;
  notes?: string | null;
  created_by?: string | null;
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
