"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { uploadClinicalImageAction } from "@/lib/clinical/actions";
import type {
  ClinicalImage,
  ClinicalImageType,
  ClinicalRecordWithNames,
} from "@/lib/types/clinical";
import { CLINICAL_IMAGE_TYPE_LABELS } from "@/lib/types/clinical";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ClinicalRecordDetail({
  record,
  images,
}: {
  record: ClinicalRecordWithNames;
  images: ClinicalImage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("clinical_record_id", record.id);
    startTransition(async () => {
      const result = await uploadClinicalImageAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Imagen subida");
      event.currentTarget.reset();
      router.refresh();
    });
  }

  const fields: [string, string | null][] = [
    ["Motivo", record.chief_complaint],
    ["Antecedentes", record.antecedents],
    ["Alergias", record.allergies],
    ["Medicamentos", record.current_medications],
    ["Diagnóstico", record.diagnosis],
    ["Plan", record.treatment_plan],
    ["Observaciones", record.observations],
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Ficha clínica
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.patient_name} · {record.record_date}
          </p>
          <Badge className="mt-2" variant="secondary">
            {record.doctor_name}
          </Badge>
        </div>
        <Link href="/fichas" className={cn(buttonVariants({ variant: "ghost" }))}>
          Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className="text-muted-foreground">{label}</p>
              <p className="font-medium whitespace-pre-wrap">{value || "—"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes clínicas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={onUpload} className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="file">Archivo</Label>
              <Input id="file" name="file" type="file" accept="image/*" required disabled={pending} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="image_type">Tipo</Label>
              <select
                id="image_type"
                name="image_type"
                defaultValue="radiografia"
                disabled={pending}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {(Object.keys(CLINICAL_IMAGE_TYPE_LABELS) as ClinicalImageType[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {CLINICAL_IMAGE_TYPE_LABELS[key]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="caption">Descripción</Label>
              <Input id="caption" name="caption" disabled={pending} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Subiendo…" : "Subir imagen"}
              </Button>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin imágenes aún.</p>
            ) : (
              images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className="overflow-hidden rounded-xl border text-left"
                  onClick={() => setZoomUrl(image.signed_url ?? null)}
                >
                  {image.signed_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.signed_url}
                      alt={image.caption || image.image_type}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                      Sin preview
                    </div>
                  )}
                  <div className="p-2 text-xs">
                    {CLINICAL_IMAGE_TYPE_LABELS[image.image_type]}
                    {image.caption ? ` · ${image.caption}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {zoomUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomUrl(null)}
          onKeyDown={(e) => e.key === "Escape" && setZoomUrl(null)}
          role="dialog"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomUrl}
            alt="Vista ampliada"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
