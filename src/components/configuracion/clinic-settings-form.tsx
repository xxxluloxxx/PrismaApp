"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateClinicSettingsAction } from "@/lib/clinic-settings/actions";
import type { ClinicSettings } from "@/lib/types/clinic-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ClinicSettingsForm({ settings }: { settings: ClinicSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [taxPercent, setTaxPercent] = useState(
    String(Math.round(settings.tax_rate * 10000) / 100)
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const tax = Number(taxPercent) / 100;

    startTransition(async () => {
      const result = await updateClinicSettingsAction({
        clinic_name: String(form.get("clinic_name") ?? ""),
        phone: String(form.get("phone") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
        address: String(form.get("address") ?? "").trim() || null,
        timezone: String(form.get("timezone") ?? "America/Guayaquil"),
        tax_rate: tax,
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success("Configuración guardada");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="clinic_name">Nombre de la clínica</Label>
        <Input
          id="clinic_name"
          name="clinic_name"
          required
          defaultValue={settings.clinic_name}
          disabled={pending}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={settings.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={settings.email ?? ""}
            disabled={pending}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={settings.address ?? ""}
          disabled={pending}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tax_rate">IVA (%)</Label>
          <Input
            id="tax_rate"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxPercent}
            disabled={pending}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input
            id="timezone"
            name="timezone"
            required
            defaultValue={settings.timezone}
            disabled={pending}
            placeholder="America/Guayaquil"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
