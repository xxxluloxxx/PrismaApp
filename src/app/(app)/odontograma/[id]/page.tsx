import Link from "next/link";
import { notFound } from "next/navigation";

import { OdontogramChart } from "@/components/odontograma/odontogram-chart";
import { buttonVariants } from "@/components/ui/button";
import { getOdontogramById } from "@/lib/supabase/odontogram";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OdontogramaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOdontogramById(id);
  if (result.error || !result.data) notFound();

  const chart = result.data;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Odontograma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {chart.patient_name} ·{" "}
            {new Date(chart.created_at).toLocaleString("es-EC")}
          </p>
        </div>
        <Link
          href="/odontograma"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Volver
        </Link>
      </div>

      <OdontogramChart
        odontogramId={chart.id}
        initialTeeth={chart.teeth ?? []}
      />
    </div>
  );
}
