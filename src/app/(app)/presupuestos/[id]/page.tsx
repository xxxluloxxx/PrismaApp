import { notFound } from "next/navigation";

import { QuoteDetail } from "@/components/presupuestos/quote-detail";
import { listPaymentsByQuote } from "@/lib/supabase/payment";
import { getQuoteById } from "@/lib/supabase/quote";
import { listTreatments } from "@/lib/supabase/treatment";

export const dynamic = "force-dynamic";

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getQuoteById(id);
  if (result.error || !result.data) notFound();

  const [payments, treatments] = await Promise.all([
    listPaymentsByQuote(id),
    listTreatments({ activeOnly: true }),
  ]);

  return (
    <QuoteDetail
      quote={result.data}
      payments={payments.data ?? []}
      treatments={treatments.data ?? []}
    />
  );
}
