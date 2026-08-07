-- =============================================================================
-- 0006_clinical_records.sql — fichas + imágenes (Storage path)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id),
  doctor_id uuid NOT NULL REFERENCES public.profiles (id),
  appointment_id uuid REFERENCES public.appointments (id) ON DELETE SET NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  antecedents text,
  allergies text,
  current_medications text,
  diagnosis text,
  treatment_plan text,
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinical_records_patient_idx
  ON public.clinical_records (patient_id, record_date DESC);
CREATE INDEX IF NOT EXISTS clinical_records_doctor_idx
  ON public.clinical_records (doctor_id);

CREATE TABLE IF NOT EXISTS public.clinical_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_record_id uuid NOT NULL REFERENCES public.clinical_records (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  image_type text NOT NULL DEFAULT 'otro'
    CHECK (image_type IN ('radiografia', 'foto_intraoral', 'foto_extraoral', 'escaneo', 'otro')),
  caption text,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinical_images_record_idx
  ON public.clinical_images (clinical_record_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.clinical_records;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clinical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_records_select_staff"
  ON public.clinical_records FOR SELECT TO authenticated
  USING (public.is_active_staff());

CREATE POLICY "clinical_records_insert_staff"
  ON public.clinical_records FOR INSERT TO authenticated
  WITH CHECK (public.is_active_staff());

CREATE POLICY "clinical_records_update_staff"
  ON public.clinical_records FOR UPDATE TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

CREATE POLICY "clinical_images_select_staff"
  ON public.clinical_images FOR SELECT TO authenticated
  USING (public.is_active_staff());

CREATE POLICY "clinical_images_insert_staff"
  ON public.clinical_images FOR INSERT TO authenticated
  WITH CHECK (public.is_active_staff());

CREATE POLICY "clinical_images_delete_staff"
  ON public.clinical_images FOR DELETE TO authenticated
  USING (public.is_active_staff());

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-images', 'clinical-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "clinical_images_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clinical-images' AND public.is_active_staff());

CREATE POLICY "clinical_images_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinical-images' AND public.is_active_staff());

CREATE POLICY "clinical_images_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clinical-images' AND public.is_active_staff());
