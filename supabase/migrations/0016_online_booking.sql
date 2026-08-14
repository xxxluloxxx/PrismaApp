-- =============================================================================
-- 0016_online_booking.sql — reserva pública de citas con acceso solo servidor
-- =============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'staff';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_source_check'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_source_check
      CHECK (source IN ('online', 'staff'));
  END IF;
END
$$;

COMMENT ON COLUMN public.appointments.source IS
  'Origen de la cita: staff si fue creada por el equipo u online si fue reservada desde el flujo público.';

UPDATE public.clinic_settings
SET business_hours = jsonb_build_object(
  'mon', jsonb_build_array(jsonb_build_array('08:00', '18:00')),
  'tue', jsonb_build_array(jsonb_build_array('08:00', '18:00')),
  'wed', jsonb_build_array(jsonb_build_array('08:00', '18:00')),
  'thu', jsonb_build_array(jsonb_build_array('08:00', '18:00')),
  'fri', jsonb_build_array(jsonb_build_array('08:00', '18:00')),
  'sat', jsonb_build_array(jsonb_build_array('08:00', '13:00')),
  'sun', jsonb_build_array()
)
WHERE id = true AND business_hours = '{}'::jsonb;

COMMENT ON COLUMN public.clinic_settings.business_hours IS
  'Horario semanal: objeto JSON con claves de día de 3 letras en inglés (mon,tue,wed,thu,fri,sat,sun) y arrays de bloques ["HH:MM","HH:MM"] en formato 24h, expresados en la hora local de clinic_settings.timezone; un día cerrado usa [] o una clave ausente.';

CREATE TABLE IF NOT EXISTS public.public_booking_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_booking_attempts_identifier_idx
  ON public.public_booking_attempts (identifier, created_at DESC);

ALTER TABLE public.public_booking_attempts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.public_booking_attempts IS
  'Intentos de reserva pública (identificador = IP normalizada o IP+teléfono) para rate limiting básico en /api/public/appointments. Sin policies RLS: acceso exclusivo vía service role desde el servidor. Filas viejas se limpian best-effort desde el propio Route Handler.';

REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.treatments FROM anon;
REVOKE ALL ON public.clinic_settings FROM anon;
REVOKE ALL ON public.public_booking_attempts FROM anon;
REVOKE ALL ON public.appointment_status_history FROM anon;

-- NOTA DE SEGURIDAD:
-- Toda lectura y escritura pública de la Fase 25 pasa por Route Handlers con
-- service role: /api/public/booking/options, /api/public/booking/slots y
-- /api/public/appointments. No se exponen policies RLS anónimas ni funciones
-- SECURITY DEFINER a anon; prevent_appointment_overlap (0005) conserva la
-- última defensa frente a condiciones de carrera entre reservas simultáneas.
