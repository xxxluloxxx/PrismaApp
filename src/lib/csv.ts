/** Escapa un valor CSV (comillas, comas, saltos de línea). */
function escapeCsvValue(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera un CSV en el cliente y dispara la descarga vía Blob + `<a>` temporal.
 * Los encabezados salen de las keys del primer row.
 */
export function downloadCsv(
  filename: string,
  rows: Record<string, string | number>[]
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((key) => escapeCsvValue(row[key] ?? "")).join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
