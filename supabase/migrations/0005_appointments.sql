-- =============================================================================
-- 0005_appointments.sql — citas unificadas + anti-solape + historial
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id),
  doctor_id uuid NOT NULL REFERENCES public.profiles (id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reason text,
  notes text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_range_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS appointments_doctor_starts_idx
  ON public.appointments (doctor_id, starts_at);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments (status);

CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments (id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);

CREATE INDEX IF NOT EXISTS appointment_status_history_appt_idx
  ON public.appointment_status_history (appointment_id, changed_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.appointments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('scheduled', 'confirmed') THEN
    IF EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.doctor_id = NEW.doctor_id
        AND a.id IS DISTINCT FROM NEW.id
        AND a.status IN ('scheduled', 'confirmed')
        AND tstzrange(a.starts_at, a.ends_at, '[)') &&
            tstzrange(NEW.starts_at, NEW.ends_at, '[)')
    ) THEN
      RAISE EXCEPTION 'El médico ya tiene una cita en ese horario';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_appointment_overlap ON public.appointments;
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, doctor_id
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointment_overlap();

CREATE OR REPLACE FUNCTION public.log_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_status_history (appointment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.appointment_status_history (appointment_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_appointment_status_change ON public.appointments;
CREATE TRIGGER log_appointment_status_change
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_appointment_status_change();

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_staff"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_active_staff());

CREATE POLICY "appointments_insert_staff"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_active_staff());

CREATE POLICY "appointments_update_staff"
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_active_staff())
  WITH CHECK (public.is_active_staff());

CREATE POLICY "appointment_history_select_staff"
  ON public.appointment_status_history FOR SELECT TO authenticated
  USING (public.is_active_staff());
