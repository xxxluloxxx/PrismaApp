import { notFound } from "next/navigation";

import { AppointmentDetail } from "@/components/agenda/appointment-detail";
import { getAppointmentById } from "@/lib/supabase/appointment";

export const dynamic = "force-dynamic";

export default async function CitaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAppointmentById(id);
  if (result.error || !result.data) notFound();
  return <AppointmentDetail appointment={result.data} />;
}
