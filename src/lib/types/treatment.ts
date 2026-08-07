export type TreatmentCategory =
  | "preventivo"
  | "operatoria"
  | "endodoncia"
  | "cirugia"
  | "ortodoncia"
  | "estetica"
  | "otro";

export type Treatment = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: TreatmentCategory;
  price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TreatmentInsert = {
  code: string;
  name: string;
  description?: string | null;
  category: TreatmentCategory;
  price: number;
  duration_minutes?: number | null;
};

export type TreatmentUpdate = Partial<TreatmentInsert> & {
  is_active?: boolean;
};

export const TREATMENT_CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  preventivo: "Preventivo",
  operatoria: "Operatoria",
  endodoncia: "Endodoncia",
  cirugia: "Cirugía",
  ortodoncia: "Ortodoncia",
  estetica: "Estética",
  otro: "Otro",
};
