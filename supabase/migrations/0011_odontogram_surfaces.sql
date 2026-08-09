-- =============================================================================
-- 0011_odontogram_surfaces.sql
-- Rediseño de odontogram_teeth: una fila por (odontogram_id, tooth_code, surface)
-- en vez de una fila por diente completo con surfaces[] sin usar.
-- =============================================================================

-- 1. Agregar la nueva columna surface como nullable primero, para poder
--    backfillear las filas existentes antes de exigir NOT NULL / CHECK.
ALTER TABLE public.odontogram_teeth
  ADD COLUMN IF NOT EXISTS surface text;

-- 2. Backfill: las filas existentes representaban condición de todo el diente
--    (surfaces siempre era '{}' en la práctica), así que se migran a 'total'.
UPDATE public.odontogram_teeth
  SET surface = 'total'
  WHERE surface IS NULL;

-- 3. Aplicar NOT NULL + CHECK sobre el catálogo cerrado de superficies.
ALTER TABLE public.odontogram_teeth
  ALTER COLUMN surface SET NOT NULL;

ALTER TABLE public.odontogram_teeth
  ADD CONSTRAINT odontogram_teeth_surface_check
  CHECK (surface IN ('M', 'D', 'O', 'V', 'L', 'total'));

-- 4. Quitar la columna vieja surfaces (array), ya no se usa.
ALTER TABLE public.odontogram_teeth
  DROP COLUMN IF EXISTS surfaces;

-- 5. Reemplazar el UNIQUE por diente completo por UNIQUE por (diente, cara).
ALTER TABLE public.odontogram_teeth
  DROP CONSTRAINT IF EXISTS odontogram_teeth_odontogram_id_tooth_code_key;

ALTER TABLE public.odontogram_teeth
  ADD CONSTRAINT odontogram_teeth_odontogram_id_tooth_code_surface_key
  UNIQUE (odontogram_id, tooth_code, surface);

-- Nota: las políticas RLS de odontogram_teeth (0007_odontograms.sql) están
-- definidas sobre is_active_staff() y no referencian columnas específicas,
-- por lo que no requieren cambios.
