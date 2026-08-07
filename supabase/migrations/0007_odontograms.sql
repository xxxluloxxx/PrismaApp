-- =============================================================================
-- 0007_odontograms.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.odontograms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id),
  clinical_record_id uuid REFERENCES public.clinical_records (id) ON DELETE SET NULL,
  chart_type text NOT NULL DEFAULT 'adulto' CHECK (chart_type IN ('adulto', 'pediatrico')),
  notes text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.odontogram_teeth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odontogram_id uuid NOT NULL REFERENCES public.odontograms (id) ON DELETE CASCADE,
  tooth_code text NOT NULL,
  surfaces text[] NOT NULL DEFAULT '{}',
  condition text NOT NULL CHECK (condition IN (
    'sano','caries','obturacion','corona','endodoncia','ausente',
    'extraccion_indicada','implante','protesis','fractura','sellante','otro'
  )),
  notes text,
  UNIQUE (odontogram_id, tooth_code)
);

CREATE INDEX IF NOT EXISTS odontograms_patient_idx ON public.odontograms (patient_id, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.odontograms;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.odontograms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_teeth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "odontograms_select_staff" ON public.odontograms FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "odontograms_insert_staff" ON public.odontograms FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "odontograms_update_staff" ON public.odontograms FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());
CREATE POLICY "odontogram_teeth_select_staff" ON public.odontogram_teeth FOR SELECT TO authenticated USING (public.is_active_staff());
CREATE POLICY "odontogram_teeth_insert_staff" ON public.odontogram_teeth FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());
CREATE POLICY "odontogram_teeth_update_staff" ON public.odontogram_teeth FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());
CREATE POLICY "odontogram_teeth_delete_staff" ON public.odontogram_teeth FOR DELETE TO authenticated USING (public.is_active_staff());
