-- =============================================================================
-- 0012_update_quote_items.sql — permite editar las líneas de un presupuesto
-- ya creado, siempre que todavía no tenga pagos registrados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- update_quote_items(): reemplaza por completo las líneas de un presupuesto
-- (DELETE + INSERT) y recalcula subtotal/tax_amount/total en la misma
-- transacción de servidor, con el mismo patrón que create_quote_with_items()
-- (0010): SECURITY INVOKER, así que las policies de quotes/quote_items se
-- siguen aplicando normalmente (quote_items ya tiene policy de DELETE, a
-- diferencia de quotes en el flujo de creación).
--
-- Regla de negocio (acordada con el usuario): las líneas de un presupuesto
-- solo se pueden editar mientras no tenga ningún pago registrado todavía —
-- una vez que hay al menos un pago, el total queda "congelado" para proteger
-- la integridad contable (coincide con sync_quote_payment_status(), que ya
-- rechaza pagos que excedan el total). Esta función valida esa regla
-- server-side, sin confiar en que la UI oculte el botón de editar.
--
-- tax_rate: se usa el que el presupuesto ya tiene guardado (snapshot al
-- emitirlo), NO se recalcula desde clinic_settings.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_quote_items(
  p_quote_id uuid,
  p_items jsonb
)
RETURNS public.quotes
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_payment_count int;
  v_subtotal numeric(12,2);
  v_tax_amount numeric(12,2);
  v_total numeric(12,2);
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El presupuesto necesita al menos una línea';
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado';
  END IF;

  SELECT count(*) INTO v_payment_count
  FROM public.payments
  WHERE quote_id = p_quote_id;

  IF v_payment_count > 0 THEN
    RAISE EXCEPTION 'No se pueden editar las líneas de un presupuesto que ya tiene pagos registrados';
  END IF;

  IF v_quote.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Solo se pueden editar las líneas de un presupuesto en borrador o pendiente';
  END IF;

  DELETE FROM public.quote_items WHERE quote_id = p_quote_id;

  INSERT INTO public.quote_items (
    quote_id, treatment_id, description, quantity, unit_price, line_total, sort_order
  )
  SELECT
    p_quote_id,
    NULLIF(item->>'treatment_id', '')::uuid,
    item->>'description',
    (item->>'quantity')::numeric,
    (item->>'unit_price')::numeric,
    round(((item->>'quantity')::numeric * (item->>'unit_price')::numeric)::numeric, 2),
    COALESCE((item->>'sort_order')::int, (ordinality - 1)::int)
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality);

  SELECT
    round(sum(line_total)::numeric, 2)
  INTO v_subtotal
  FROM public.quote_items
  WHERE quote_id = p_quote_id;

  v_tax_amount := round((v_subtotal * v_quote.tax_rate)::numeric, 2);
  v_total := round((v_subtotal + v_tax_amount)::numeric, 2);

  UPDATE public.quotes
  SET subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      total = v_total,
      updated_at = now()
  WHERE id = p_quote_id
  RETURNING * INTO v_quote;

  RETURN v_quote;
END;
$$;

REVOKE ALL ON FUNCTION public.update_quote_items(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_quote_items(uuid, jsonb) TO authenticated;
