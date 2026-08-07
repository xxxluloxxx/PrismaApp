"use server";

import { revalidatePath } from "next/cache";

import {
  addClinicalImageMeta,
  createClinicalRecord,
  updateClinicalRecord,
} from "@/lib/supabase/clinical";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  ClinicalImageType,
  ClinicalRecordInsert,
} from "@/lib/types/clinical";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createClinicalRecordAction(
  input: Omit<ClinicalRecordInsert, "doctor_id"> & { doctor_id?: string }
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await createClinicalRecord({
    ...input,
    doctor_id: input.doctor_id || profile.profile.id,
  });

  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo crear la ficha",
    };
  }

  revalidatePath("/fichas");
  return { ok: true, id: result.data.id };
}

export async function updateClinicalRecordAction(
  id: string,
  input: Partial<ClinicalRecordInsert>
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const result = await updateClinicalRecord(id, input);
  if (result.error || !result.data) {
    return {
      ok: false,
      message: result.message ?? "No se pudo actualizar la ficha",
    };
  }

  revalidatePath("/fichas");
  revalidatePath(`/fichas/${id}`);
  return { ok: true, id: result.data.id };
}

export async function uploadClinicalImageAction(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.error || !profile.profile) {
    return { ok: false, message: "No autenticado" };
  }

  const recordId = String(formData.get("clinical_record_id") ?? "");
  const imageType = String(formData.get("image_type") ?? "otro") as ClinicalImageType;
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("file");

  if (!recordId || !(file instanceof File)) {
    return { ok: false, message: "Faltan datos de la imagen" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${recordId}/${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("clinical-images")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const meta = await addClinicalImageMeta({
    clinical_record_id: recordId,
    storage_path: path,
    image_type: imageType,
    caption,
    uploaded_by: profile.profile.id,
  });

  if (meta.error || !meta.data) {
    return { ok: false, message: meta.message ?? "No se pudo guardar metadatos" };
  }

  revalidatePath(`/fichas/${recordId}`);
  return { ok: true, id: meta.data.id };
}
