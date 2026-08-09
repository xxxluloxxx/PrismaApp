-- =============================================================================
-- 0010_hardening_fixes.sql — corrige 3 hallazgos bloqueantes de auditoría
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Anti-solape de citas: el trigger BEFORE INSERT/UPDATE (0005) es
--    vulnerable a condición de carrera entre inserciones concurrentes.
--    Se añade un EXCLUDE constraint (garantía real a nivel de BD) y se deja
--    el trigger existente solo como capa de error amigable (falla primero,
--    con mejor mensaje, antes de que el constraint dispare un genérico).
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('scheduled', 'confirmed'));

-- -----------------------------------------------------------------------------
-- 2) Presupuestos: create_quote_with_items() reemplaza el patrón
--    insert-cabecera + insert-líneas + "rollback manual con DELETE" del
--    cliente (src/lib/supabase/quote.ts), que fallaba en silencio porque
--    quotes no tiene policy de DELETE. Una función RPC ejecuta ambos
--    inserts en una sola transacción de servidor: si las líneas fallan,
--    Postgres revierte también la cabecera automáticamente.
--    SECURITY INVOKER (default): corre con los permisos del usuario que
--    llama, así que las políticas RLS de quotes/quote_items se siguen
--    aplicando normalmente, sin necesitar policy de DELETE.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_quote_with_items(
  p_header jsonb,
  p_items jsonb
)
RETURNS public.quotes
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El presupuesto necesita al menos una línea';
  END IF;

  INSERT INTO public.quotes (
    patient_id, doctor_id, clinical_record_id, issue_date, status,
    currency, subtotal, tax_rate, tax_amount, total, notes, created_by
  )
  VALUES (
    (p_header->>'patient_id')::uuid,
    (p_header->>'doctor_id')::uuid,
    NULLIF(p_header->>'clinical_record_id', '')::uuid,
    COALESCE((p_header->>'issue_date')::date, CURRENT_DATE),
    COALESCE(p_header->>'status', 'draft'),
    COALESCE(p_header->>'currency', 'USD'),
    (p_header->>'subtotal')::numeric,
    (p_header->>'tax_rate')::numeric,
    (p_header->>'tax_amount')::numeric,
    (p_header->>'total')::numeric,
    NULLIF(p_header->>'notes', ''),
    NULLIF(p_header->>'created_by', '')::uuid
  )
  RETURNING * INTO v_quote;

  INSERT INTO public.quote_items (
    quote_id, treatment_id, description, quantity, unit_price, line_total, sort_order
  )
  SELECT
    v_quote.id,
    NULLIF(item->>'treatment_id', '')::uuid,
    item->>'description',
    (item->>'quantity')::numeric,
    (item->>'unit_price')::numeric,
    round(((item->>'quantity')::numeric * (item->>'unit_price')::numeric)::numeric, 2),
    COALESCE((item->>'sort_order')::int, (ordinality - 1)::int)
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality);

  RETURN v_quote;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quote_with_items(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_quote_with_items(jsonb, jsonb) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3) Funciones SECURITY DEFINER de 0005/0008 que quedaron sin revoke
--    explícito en 0009 (defense in depth, mismo patrón que is_admin() /
--    is_active_staff()). No rompe los triggers: EXECUTE controla la
--    invocación directa, no el disparo automático vía trigger.
-- -----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.log_appointment_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_quote_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_quote_payment_status() FROM PUBLIC;
