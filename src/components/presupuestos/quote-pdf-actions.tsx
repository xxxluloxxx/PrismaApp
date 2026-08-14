"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  isValidEcuadorPhone,
  normalizeEcuadorPhone,
} from "@/lib/phone";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  partially_paid: "Pago parcial",
  paid: "Pagado",
  cancelled: "Cancelado",
};

export function QuotePdfActions({
  quoteId,
  patientName,
  patientPhone,
  total,
  currency,
  status,
}: {
  quoteId: string;
  patientName: string;
  patientPhone: string | null;
  total: number;
  currency: string;
  status: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const validPhone = isValidEcuadorPhone(patientPhone);

  async function fetchPdfUrl(): Promise<string> {
    const response = await fetch(`/api/quotes/${quoteId}/pdf`);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "No se pudo generar el PDF.");
    }

    const payload = (await response.json()) as { url: string };
    return payload.url;
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const url = await fetchPdfUrl();
      window.open(url, "_blank");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo generar el PDF."
      );
    } finally {
      setDownloading(false);
    }
  }

  async function sendByWhatsApp() {
    const phone = normalizeEcuadorPhone(patientPhone);
    if (!phone) return;

    setSending(true);
    try {
      const url = await fetchPdfUrl();
      const formattedTotal = new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency,
      }).format(total);
      const statusLabel = STATUS_LABELS[status] ?? status;
      const message = [
        `Hola ${patientName},`,
        `Compartimos su presupuesto dental (${statusLabel}) por ${formattedTotal}.`,
        url,
      ].join("\n");
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo generar el PDF."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={downloading}
          onClick={downloadPdf}
        >
          <Download data-icon="inline-start" />
          {downloading ? "Generando…" : "Descargar PDF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!validPhone || sending}
          onClick={sendByWhatsApp}
        >
          {sending ? "Generando…" : "Enviar por WhatsApp"}
        </Button>
      </div>
      {!validPhone ? (
        <p className="text-xs text-muted-foreground">
          El paciente no tiene un teléfono válido registrado.
        </p>
      ) : null}
    </div>
  );
}
