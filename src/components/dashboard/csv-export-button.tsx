"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";

export function CsvExportButton({
  filename,
  rows,
  label = "Exportar CSV",
}: {
  filename: string;
  rows: Record<string, string | number>[];
  label?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => downloadCsv(filename, rows)}
    >
      <Download data-icon="inline-start" />
      {label}
    </Button>
  );
}
