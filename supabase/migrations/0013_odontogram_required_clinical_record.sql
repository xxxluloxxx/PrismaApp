-- =============================================================================
-- 0013_odontogram_required_clinical_record.sql
-- Fase 20 — Odontograma 1:1 con la ficha clínica (rediseño de Fase 5).
--
-- En Fase 5 el odontograma quedó ligado al paciente, con clinical_record_id
-- opcional y sin usar en la práctica: un paciente podía acumular varios
-- odontogramas sueltos en el tiempo, ninguno amarrado a una ficha concreta.
-- El modelo correcto es 1 ficha = 1 odontograma obligatorio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Eliminar odontogramas huérfanos (clinical_record_id IS NULL). Son datos
--    de prueba, no de pacientes reales (autorizado explícitamente). El DELETE
--    en odontograms limpia en cascada sus filas en odontogram_teeth
--    (FK odontogram_teeth.odontogram_id ... ON DELETE CASCADE, ver 0007).
-- -----------------------------------------------------------------------------

DELETE FROM public.odontograms WHERE clinical_record_id IS NULL;

-- -----------------------------------------------------------------------------
-- 2) clinical_record_id pasa a NOT NULL + UNIQUE (1:1 real con la ficha).
--    Se reemplaza el FK ON DELETE SET NULL (inválido ahora, violaría el
--    NOT NULL) por ON DELETE CASCADE: si se borra una ficha clínica, su
--    odontograma (y sus dientes) se borran con ella. Mismo patrón que
--    clinical_images -> clinical_records en 0006.
-- -----------------------------------------------------------------------------

ALTER TABLE public.odontograms
  ALTER COLUMN clinical_record_id SET NOT NULL;

ALTER TABLE public.odontograms
  DROP CONSTRAINT odontograms_clinical_record_id_fkey;

ALTER TABLE public.odontograms
  ADD CONSTRAINT odontograms_clinical_record_id_fkey
  FOREIGN KEY (clinical_record_id) REFERENCES public.clinical_records (id)
  ON DELETE CASCADE;

ALTER TABLE public.odontograms
  ADD CONSTRAINT odontograms_clinical_record_id_key UNIQUE (clinical_record_id);

-- -----------------------------------------------------------------------------
-- 3) create_clinical_record_with_odontogram(): crea la ficha clínica y su
--    odontograma obligatorio en una sola transacción de servidor, clonando
--    las condiciones del odontograma de la ficha anterior más reciente del
--    mismo paciente (si existe) — mismo comportamiento que el checkbox
--    "Clonar último" del flujo manual (src/lib/supabase/odontogram.ts),
--    ahora automático y garantizado (nunca hay ficha sin odontograma cuando
--    se crea por este camino).
--
--    SECURITY INVOKER (default, igual que create_quote_with_items en 0010):
--    corre con los permisos del usuario que llama, así que las políticas RLS
--    de clinical_records / odontograms / odontogram_teeth se siguen
--    aplicando normalmente. Se prefiere una función SQL sobre varias queries
--    sueltas desde el server action para que la creación de la ficha y su
--    odontograma sean atómicas: si el insert del odontograma fallara, la
--    ficha tampoco se crea (rollback automático de Postgres), evitando
--    fichas sin odontograma por un error a mitad de camino.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_clinical_record_with_odontogram(
  p_record jsonb
)
RETURNS public.clinical_records
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_record public.clinical_records%ROWTYPE;
  v_odontogram_id uuid;
  v_previous_odontogram_id uuid;
  v_created_by uuid;
BEGIN
  INSERT INTO public.clinical_records (
    patient_id, doctor_id, appointment_id, record_date, chief_complaint,
    antecedents, allergies, current_medications, diagnosis, treatment_plan,
    observations
  )
  VALUES (
    (p_record->>'patient_id')::uuid,
    (p_record->>'doctor_id')::uuid,
    NULLIF(p_record->>'appointment_id', '')::uuid,
    COALESCE((p_record->>'record_date')::date, CURRENT_DATE),
    NULLIF(p_record->>'chief_complaint', ''),
    NULLIF(p_record->>'antecedents', ''),
    NULLIF(p_record->>'allergies', ''),
    NULLIF(p_record->>'current_medications', ''),
    NULLIF(p_record->>'diagnosis', ''),
    NULLIF(p_record->>'treatment_plan', ''),
    NULLIF(p_record->>'observations', '')
  )
  RETURNING * INTO v_record;

  v_created_by := v_record.doctor_id;

  INSERT INTO public.odontograms (patient_id, clinical_record_id, chart_type, created_by)
  VALUES (v_record.patient_id, v_record.id, 'adulto', v_created_by)
  RETURNING id INTO v_odontogram_id;

  -- Odontograma de la ficha anterior más reciente del mismo paciente
  -- (excluyendo el recién creado, que ya tiene created_at >= cualquier otro).
  SELECT o.id INTO v_previous_odontogram_id
  FROM public.odontograms o
  WHERE o.patient_id = v_record.patient_id
    AND o.id <> v_odontogram_id
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF v_previous_odontogram_id IS NOT NULL THEN
    INSERT INTO public.odontogram_teeth (odontogram_id, tooth_code, surface, condition, notes)
    SELECT v_odontogram_id, t.tooth_code, t.surface, t.condition, t.notes
    FROM public.odontogram_teeth t
    WHERE t.odontogram_id = v_previous_odontogram_id;
  END IF;

  RETURN v_record;
END;
$$;

REVOKE ALL ON FUNCTION public.create_clinical_record_with_odontogram(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_clinical_record_with_odontogram(jsonb) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4) RLS: sin cambios. Las policies de odontograms/odontogram_teeth (0007)
--    están definidas sobre is_active_staff() y no referencian columnas
--    específicas ni nulabilidad de clinical_record_id, por lo que siguen
--    siendo coherentes tras el NOT NULL + UNIQUE. La función es
--    SECURITY INVOKER, así que sigue exigiendo que el usuario tenga permiso
--    de INSERT en clinical_records y en odontograms/odontogram_teeth.
-- -----------------------------------------------------------------------------
