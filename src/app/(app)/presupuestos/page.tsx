import { QuotesList } from "@/components/presupuestos/quotes-list";
import { listQuotes } from "@/lib/supabase/quote";

export const dynamic = "force-dynamic";

export default async function PresupuestosPage() {
  const result = await listQuotes();
  return (
    <>
      <QuotesList quotes={result.data ?? []} />
      {result.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudieron cargar los presupuestos
          {result.message ? `: ${result.message}` : ". ¿Aplicaste la migración 0008?"}
        </p>
      ) : null}
    </>
  );
}
