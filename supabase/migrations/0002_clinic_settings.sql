-- =============================================================================
-- 0002_clinic_settings.sql — configuración singleton de la clínica
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  clinic_name text NOT NULL DEFAULT 'Prisma Clínica',
  phone text,
  email text,
  address text,
  timezone text NOT NULL DEFAULT 'America/Guayaquil',
  tax_rate numeric(5, 4) NOT NULL DEFAULT 0.15 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  currency text NOT NULL DEFAULT 'USD',
  business_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.clinic_settings IS
  'Una sola fila de configuración de la clínica (MVP single-tenant).';

INSERT INTO public.clinic_settings (id, clinic_name)
VALUES (true, 'Prisma Clínica')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_updated_at ON public.clinic_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_settings_select_staff"
  ON public.clinic_settings
  FOR SELECT
  TO authenticated
  USING (public.is_active_staff());

CREATE POLICY "clinic_settings_update_admin"
  ON public.clinic_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
