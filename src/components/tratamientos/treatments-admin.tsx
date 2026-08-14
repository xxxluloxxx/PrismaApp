"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createTreatmentAction,
  updateTreatmentAction,
} from "@/lib/treatments/actions";
import type { Treatment, TreatmentCategory } from "@/lib/types/treatment";
import { TREATMENT_CATEGORY_LABELS } from "@/lib/types/treatment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [editingId, setEditingId] = useState<string | null>(null);

  function onUpdate(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    const durationRaw = String(form.get("duration_minutes") ?? "").trim();
    startTransition(async () => {
      const result = await updateTreatmentAction(id, {
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
      toast.success("Tratamiento actualizado");
      setEditingId(null);
      router.refresh();
    });
  }

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

  function renderEditForm(t: Treatment) {
    return (
      <form
        onSubmit={(e) => onUpdate(t.id, e)}
        className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={`code-${t.id}`}>Código</Label>
          <Input
            id={`code-${t.id}`}
            name="code"
            defaultValue={t.code}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`name-${t.id}`}>Nombre</Label>
          <Input
            id={`name-${t.id}`}
            name="name"
            defaultValue={t.name}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`category-${t.id}`}>Categoría</Label>
          <Select name="category" defaultValue={t.category} disabled={pending}>
            <SelectTrigger id={`category-${t.id}`} size="sm" className="w-full">
              <SelectValue>
                {(value: TreatmentCategory) => TREATMENT_CATEGORY_LABELS[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {TREATMENT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`price-${t.id}`}>Precio</Label>
          <Input
            id={`price-${t.id}`}
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={t.price}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`duration-${t.id}`}>Duración (min)</Label>
          <Input
            id={`duration-${t.id}`}
            name="duration_minutes"
            type="number"
            min="1"
            defaultValue={t.duration_minutes ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor={`description-${t.id}`}>Descripción</Label>
          <Textarea
            id={`description-${t.id}`}
            name="description"
            defaultValue={t.description ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setEditingId(null)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
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
            <Select
              name="category"
              defaultValue="preventivo"
              disabled={pending}
            >
              <SelectTrigger id="category" size="sm" className="w-full">
                <SelectValue>
                  {(value: TreatmentCategory) => TREATMENT_CATEGORY_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {TREATMENT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {treatments.length === 0 ? (
        <p className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
          Sin tratamientos
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:hidden">
            {treatments.map((t) => (
              <div key={t.id} className="flex flex-col gap-2">
                <Card
                  className="cursor-pointer"
                  onClick={() =>
                    setEditingId((prev) => (prev === t.id ? null : t.id))
                  }
                >
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {t.code} · {TREATMENT_CATEGORY_LABELS[t.category]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ${Number(t.price).toFixed(2)}
                      </span>
                    </div>
                    <Badge variant={t.is_active ? "success" : "destructive"}>
                      {t.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </CardContent>
                </Card>
                {editingId === t.id ? renderEditForm(t) : null}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border sm:block">
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
                {treatments.map((t) => (
                  <Fragment key={t.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setEditingId((prev) => (prev === t.id ? null : t.id))
                      }
                    >
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>
                        {TREATMENT_CATEGORY_LABELS[t.category]}
                      </TableCell>
                      <TableCell>${Number(t.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "success" : "destructive"}>
                          {t.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(t);
                          }}
                        >
                          {t.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {editingId === t.id ? (
                      <TableRow>
                        <TableCell colSpan={6}>{renderEditForm(t)}</TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
