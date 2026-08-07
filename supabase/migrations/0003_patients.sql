-- =============================================================================
-- 0003_patients.sql — pacientes compartidos de la clínica
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  sex text CHECK (sex IS NULL OR sex IN ('M', 'F', 'O', 'U')),
  phone text NOT NULL,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patients_document_id_unique UNIQUE (document_id)
);

CREATE INDEX IF NOT EXISTS patients_name_idx
  ON public.patients (last_name, first_name);
CREATE INDEX IF NOT EXISTS patients_phone_idx ON public.patients (phone);
CREATE INDEX IF NOT EXISTS patients_is_active_idx ON public.patients (is_active);
CREATE INDEX IF NOT EXISTS patients_document_id_idx ON public.patients (document_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.patients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_staff"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (public.is_active_staff());

CREATE POLICY "patients_insert_staff"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_staff());

CREATE POLICY "patients_update_staff"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

-- Sin DELETE: solo soft-deactivate (is_active = false).
