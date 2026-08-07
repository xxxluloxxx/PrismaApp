export type QuoteStatus =
  | "draft"
  | "pending"
  | "partially_paid"
  | "paid"
  | "cancelled";

export type PaymentMethod = "cash" | "transfer" | "card" | "other";

export type Quote = {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinical_record_id: string | null;
  issue_date: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  treatment_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
};

export type QuoteWithNames = Quote & {
  patient_name: string;
  doctor_name: string;
  items?: QuoteItem[];
  paid_amount?: number;
};

export type QuoteItemInput = {
  treatment_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
};

export type QuoteInsert = {
  patient_id: string;
  doctor_id: string;
  clinical_record_id?: string | null;
  issue_date?: string;
  status?: QuoteStatus;
  currency?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
  created_by?: string | null;
};

export type Payment = {
  id: string;
  quote_id: string;
  patient_id: string;
  paid_at: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  received_by: string | null;
  created_at: string;
};

export type PaymentInsert = {
  quote_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  received_by?: string | null;
  paid_at?: string;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  partially_paid: "Pago parcial",
  paid: "Pagado",
  cancelled: "Cancelado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};
