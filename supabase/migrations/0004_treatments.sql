-- =============================================================================
-- 0004_treatments.sql — catálogo de tratamientos
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT treatments_code_unique UNIQUE (code),
  CONSTRAINT treatments_category_check CHECK (
    category IN (
      'preventivo',
      'operatoria',
      'endodoncia',
      'cirugia',
      'ortodoncia',
      'estetica',
      'otro'
    )
  )
);

CREATE INDEX IF NOT EXISTS treatments_category_idx ON public.treatments (category);
CREATE INDEX IF NOT EXISTS treatments_is_active_idx ON public.treatments (is_active);

DROP TRIGGER IF EXISTS set_updated_at ON public.treatments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treatments_select_staff"
  ON public.treatments
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (is_active = true AND public.is_active_staff())
  );

CREATE POLICY "treatments_insert_admin"
  ON public.treatments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "treatments_update_admin"
  ON public.treatments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
