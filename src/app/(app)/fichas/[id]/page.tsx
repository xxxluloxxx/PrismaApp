import { notFound } from "next/navigation";

import { ClinicalRecordDetail } from "@/components/fichas/clinical-record-detail";
import {
  getClinicalRecordById,
  listClinicalImages,
} from "@/lib/supabase/clinical";
import { getOdontogramByClinicalRecordId } from "@/lib/supabase/odontogram";

export const dynamic = "force-dynamic";

export default async function FichaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClinicalRecordById(id);
  if (result.error || !result.data) notFound();
  const [images, odontogram] = await Promise.all([
    listClinicalImages(id),
    getOdontogramByClinicalRecordId(id),
  ]);

  return (
    <ClinicalRecordDetail
      record={result.data}
      images={images.data ?? []}
      odontogram={odontogram.error || !odontogram.data ? null : odontogram.data}
    />
  );
}
