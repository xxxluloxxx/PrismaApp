-- =============================================================================
-- 0008_quotes_and_payments.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id),
  doctor_id uuid NOT NULL REFERENCES public.profiles (id),
  clinical_record_id uuid REFERENCES public.clinical_records (id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','partially_paid','paid','cancelled')),
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  tax_rate numeric(5,4) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 1),
  tax_amount numeric(12,2) NOT NULL CHECK (tax_amount >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  notes text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_total_check CHECK (abs(total - (subtotal + tax_amount)) < 0.01)
);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments (id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  sort_order int NOT NULL DEFAULT 0,
  CONSTRAINT quote_items_line_total_check CHECK (abs(line_total - (quantity * unit_price)) < 0.01)
);

CREATE TABLE IF NOT EXISTS public.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes (id),
  patient_id uuid NOT NULL REFERENCES public.patients (id),
  paid_at timestamptz NOT NULL DEFAULT now(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('cash','transfer','card','other')),
  reference text,
  notes text,
  received_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotes_patient_idx ON public.quotes (patient_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes (status);
CREATE INDEX IF NOT EXISTS payments_quote_idx ON public.payments (quote_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.quotes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.log_quote_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.quote_status_history (quote_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.quote_status_history (quote_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS log_quote_status_change ON public.quotes;
CREATE TRIGGER log_quote_status_change AFTER INSERT OR UPDATE OF status ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.log_quote_status_change();

CREATE OR REPLACE FUNCTION public.sync_quote_payment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quotes%ROWTYPE;
  paid numeric(12,2);
BEGIN
  SELECT * INTO q FROM public.quotes WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
  IF q.status IN ('draft', 'cancelled') THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'No se pueden registrar pagos sobre presupuestos en borrador o cancelados';
    END IF;
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT coalesce(sum(amount), 0) INTO paid FROM public.payments WHERE quote_id = q.id;

  IF paid > q.total THEN
    RAISE EXCEPTION 'El pago excede el total del presupuesto';
  END IF;

  UPDATE public.quotes
  SET status = CASE
    WHEN paid <= 0 THEN 'pending'
    WHEN paid < q.total THEN 'partially_paid'
    ELSE 'paid'
  END
  WHERE id = q.id AND status NOT IN ('draft', 'cancelled');

  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS sync_quote_payment_status_ins ON public.payments;
CREATE TRIGGER sync_quote_payment_status_ins
  AFTER INSERT ON public.payments FOR EACH ROW
  EXECUTE FUNCTION public.sync_quote_payment_status();

DROP TRIGGER IF EXISTS sync_quote_payment_status_del ON public.payments;
CREATE TRIGGER sync_quote_payment_status_del
  AFTER DELETE ON public.payments FOR EACH ROW
  EXECUTE FUNCTION public.sync_quote_payment_status();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select_staff" ON public.quotes FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "quotes_insert_staff" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "quotes_update_staff" ON public.quotes FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());
CREATE POLICY "quote_items_select_staff" ON public.quote_items FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "quote_items_insert_staff" ON public.quote_items FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "quote_items_update_staff" ON public.quote_items FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());
CREATE POLICY "quote_items_delete_staff" ON public.quote_items FOR DELETE TO authenticated USING (public.is_active_staff());
CREATE POLICY "quote_history_select_staff" ON public.quote_status_history FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "payments_select_staff" ON public.payments FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "payments_insert_staff" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
