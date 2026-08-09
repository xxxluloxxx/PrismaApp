import type { AppointmentStatus } from "@/lib/types/appointment";

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Colores por estado de cita, sobre los tokens `--chart-1..5` / semánticos ya existentes en Prisma. */
export const STATUS_CHIP_CLASS: Record<AppointmentStatus, string> = {
  scheduled: "bg-chart-1/15 text-chart-1 dark:bg-chart-1/25",
  confirmed: "bg-chart-3/15 text-chart-3 dark:bg-chart-3/25",
  completed: "bg-chart-2/15 text-chart-2 dark:bg-chart-2/25",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export const STATUS_DOT_CLASS: Record<AppointmentStatus, string> = {
  scheduled: "bg-chart-1",
  confirmed: "bg-chart-3",
  completed: "bg-chart-2",
  cancelled: "bg-muted-foreground",
  no_show: "bg-destructive",
};

export const LEGEND_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

const monthYearFormatter = new Intl.DateTimeFormat("es-EC", {
  month: "long",
  year: "numeric",
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKeyFromParts(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** Clave local `YYYY-MM-DD` a partir de un ISO string (usa hora local, no UTC). */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  return dayKeyFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayLocalKey(): string {
  const now = new Date();
  return dayKeyFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Límites [00:00, 24:00) locales de un día, como ISO strings, para filtrar por rango. */
export function localDayBounds(dayKey: string): { from: string; to: string } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const from = new Date(y!, m! - 1, d!, 0, 0, 0, 0);
  const to = new Date(y!, m! - 1, d!, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export type CalendarCell = {
  dayKey: string;
  dayNumber: number;
  inMonth: boolean;
};

/** Celdas del grid mensual (lunes → domingo), incluyendo relleno de meses adyacentes. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0=domingo
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(year, month, 1 + mondayOffset);

  const last = new Date(year, month + 1, 0);
  const endDow = last.getDay();
  const sundayOffset = endDow === 0 ? 0 : 7 - endDow;
  const gridEnd = new Date(year, month, last.getDate() + sundayOffset);

  const cells: CalendarCell[] = [];
  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    cells.push({
      dayKey: dayKeyFromParts(y, m, d),
      dayNumber: d,
      inMonth: m === month,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

/** Rango ISO del primer/último día visible en el grid (incluye relleno de meses adyacentes). */
export function visibleGridBounds(visibleMonth: Date): { from: string; to: string } {
  const cells = buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth());
  const first = cells[0]!;
  const last = cells[cells.length - 1]!;
  return {
    from: localDayBounds(first.dayKey).from,
    to: localDayBounds(last.dayKey).to,
  };
}

export function formatMonthTitle(d: Date): string {
  const raw = monthYearFormatter.format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatAppointmentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Apellido abreviado, para chips compactos de celda de día.
 * `patient_name` viene formateado como "Apellido, Nombre" (ver `mapAppointmentRow`).
 */
export function shortPatientName(patientName: string | null | undefined): string {
  if (!patientName) return "—";
  const [lastName] = patientName.split(",");
  return lastName?.trim() || patientName.trim();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
