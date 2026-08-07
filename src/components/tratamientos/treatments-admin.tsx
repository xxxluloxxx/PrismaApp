"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createTreatmentAction,
  updateTreatmentAction,
} from "@/lib/treatments/actions";
import type { Treatment, TreatmentCategory } from "@/lib/types/treatment";
import { TREATMENT_CATEGORY_LABELS } from "@/lib/types/treatment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = Object.keys(
  TREATMENT_CATEGORY_LABELS
) as TreatmentCategory[];

export function TreatmentsAdmin({ treatments }: { treatments: Treatment[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    const durationRaw = String(form.get("duration_minutes") ?? "").trim();
    startTransition(async () => {
      const result = await createTreatmentAction({
        code: String(form.get("code") ?? "").trim(),
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || null,
        category: String(form.get("category") ?? "otro") as TreatmentCategory,
        price,
        duration_minutes: durationRaw ? Number(durationRaw) : null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Tratamiento creado");
      setShowForm(false);
      router.refresh();
    });
  }

  function toggleActive(treatment: Treatment) {
    startTransition(async () => {
      const result = await updateTreatmentAction(treatment.id, {
        is_active: !treatment.is_active,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(treatment.is_active ? "Desactivado" : "Reactivado");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Tratamientos
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo facturable de la clínica
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cerrar" : "Nuevo tratamiento"}
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" name="code" required disabled={pending} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required disabled={pending} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              name="category"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              disabled={pending}
              defaultValue="preventivo"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {TREATMENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="duration_minutes">Duración (min)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="1"
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" disabled={pending} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Crear"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {treatments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin tratamientos
                </TableCell>
              </TableRow>
            ) : (
              treatments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>
                    {TREATMENT_CATEGORY_LABELS[t.category]}
                  </TableCell>
                  <TableCell>${Number(t.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? "secondary" : "outline"}>
                      {t.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => toggleActive(t)}
                    >
                      {t.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
