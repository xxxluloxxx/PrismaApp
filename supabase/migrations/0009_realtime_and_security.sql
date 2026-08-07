-- =============================================================================
-- 0009_realtime_and_security.sql
-- =============================================================================

-- Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'quotes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'patients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'clinical_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinical_records;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'supabase_realtime publication not found; skip';
END $$;

-- Defense in depth: revoke dangerous defaults on helpers
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_last_admin_demotion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
