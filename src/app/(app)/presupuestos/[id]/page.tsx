import { notFound } from "next/navigation";

import { QuoteDetail } from "@/components/presupuestos/quote-detail";
import { listPaymentsByQuote } from "@/lib/supabase/payment";
import { getQuoteById } from "@/lib/supabase/quote";

export const dynamic = "force-dynamic";

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getQuoteById(id);
  if (result.error || !result.data) notFound();

  const payments = await listPaymentsByQuote(id);

  return (
    <QuoteDetail
      quote={result.data}
      payments={payments.data ?? []}
    />
  );
}
