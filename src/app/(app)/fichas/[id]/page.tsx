import { notFound } from "next/navigation";

import { ClinicalRecordDetail } from "@/components/fichas/clinical-record-detail";
import {
  getClinicalRecordById,
  listClinicalImages,
} from "@/lib/supabase/clinical";

export const dynamic = "force-dynamic";

export default async function FichaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClinicalRecordById(id);
  if (result.error || !result.data) notFound();
  const images = await listClinicalImages(id);

  return (
    <ClinicalRecordDetail
      record={result.data}
      images={images.data ?? []}
    />
  );
}
