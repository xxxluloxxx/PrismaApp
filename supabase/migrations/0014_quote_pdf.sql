-- =============================================================================
-- 0014_quote_pdf.sql — columna done en quote_items + bucket quote-pdfs +
-- RPC set_quote_item_done()
-- =============================================================================

-- Distingue en el PDF de presupuesto qué línea/tratamiento ya se realizó
-- vs cuál está pendiente.
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- Bucket privado para PDFs de presupuesto generados (mismo patrón RLS que
-- clinical-images en 0006_clinical_records.sql).
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-pdfs', 'quote-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "quote_pdfs_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'quote-pdfs' AND public.is_active_staff());

CREATE POLICY "quote_pdfs_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quote-pdfs' AND public.is_active_staff());

CREATE POLICY "quote_pdfs_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'quote-pdfs' AND public.is_active_staff());

-- -----------------------------------------------------------------------------
-- set_quote_item_done(): marca una línea de presupuesto como realizada o no.
-- A diferencia de update_quote_items (0012), NO valida "sin pagos registrados":
-- marcar done es estado operacional/clínico (qué tratamiento ya se realizó
-- físicamente al paciente), no una modificación financiera de montos,
-- cantidades o precios, así que no debe bloquearse aunque el presupuesto ya
-- tenga pagos.
-- SECURITY INVOKER: las policies RLS de quote_items se aplican normalmente.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_quote_item_done(
  p_item_id uuid,
  p_done boolean
)
RETURNS public.quote_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_item public.quote_items%ROWTYPE;
BEGIN
  UPDATE public.quote_items
  SET done = p_done
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Línea de presupuesto no encontrada';
  END IF;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.set_quote_item_done(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_quote_item_done(uuid, boolean) TO authenticated;
