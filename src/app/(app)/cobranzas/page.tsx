import { Suspense } from "react";

import { PaymentsList } from "@/components/cobranzas/payments-list";
import { listPatients } from "@/lib/supabase/patient";
import { getDailyCashCut, listPayments } from "@/lib/supabase/payment";
import { listStaff } from "@/lib/supabase/staff";
import type { PaymentMethod } from "@/lib/types/quote";

export const dynamic = "force-dynamic";

const METHODS = new Set<PaymentMethod>([
  "cash",
  "transfer",
  "card",
  "other",
]);

export default async function CobranzasPage({
  searchParams,
}: {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    patientId?: string;
    doctorId?: string;
    method?: string;
  }>;
}) {
  const params = await searchParams;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;
  const patientId = params.patientId || undefined;
  const doctorId = params.doctorId || undefined;
  const method =
    params.method && METHODS.has(params.method as PaymentMethod)
      ? (params.method as PaymentMethod)
      : undefined;

  const [paymentsResult, cashCut, patientsResult, staffResult] =
    await Promise.all([
      listPayments({ dateFrom, dateTo, patientId, doctorId, method }),
      getDailyCashCut(),
      listPatients({ activeOnly: false }),
      listStaff(),
    ]);

  const payments = paymentsResult.data ?? [];
  const patients = patientsResult.data ?? [];
  const doctors = (staffResult.data ?? []).filter((p) => p.role === "medico");

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
      <PaymentsList
        payments={payments}
        patients={patients}
        doctors={doctors}
        cashCut={cashCut}
        filters={{
          dateFrom: dateFrom ?? "",
          dateTo: dateTo ?? "",
          patientId: patientId ?? "",
          doctorId: doctorId ?? "",
          method: method ?? "",
        }}
      />
      {paymentsResult.error ? (
        <p className="mt-4 text-sm text-destructive">
          No se pudieron cargar los cobros
          {paymentsResult.message ? `: ${paymentsResult.message}` : "."}
        </p>
      ) : null}
    </Suspense>
  );
}
