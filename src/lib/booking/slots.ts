import {
  civilDatePartsInTimeZone,
  zonedDateTimeToUtc,
} from "../supabase/clinic-timezone.ts";

export const DEFAULT_BOOKING_DURATION_MINUTES = 30;
export const BOOKING_SLOT_STEP_MINUTES = 15;
export const MAX_BOOKING_SLOTS = 200;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type BusinessHours = Record<string, [string, string][]>;

export type AppointmentInterval = {
  starts_at: string;
  ends_at: string;
};

export type BookingSlot = {
  starts_at: string;
  ends_at: string;
};

type GenerateSlotsInput = {
  from: string;
  days: number;
  durationMinutes: number;
  businessHours: BusinessHours;
  timezone: string;
  appointments: AppointmentInterval[];
  now?: Date;
  maxSlots?: number;
};

type RequestedSlotInput = Omit<
  GenerateSlotsInput,
  "from" | "days" | "maxSlots"
> & {
  startsAt: Date;
  endsAt: Date;
};

function timeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function normalizeBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const normalized: BusinessHours = {};
  for (const key of DAY_KEYS) {
    const rawBlocks = (value as Record<string, unknown>)[key];
    if (!Array.isArray(rawBlocks)) continue;

    const blocks: [string, string][] = [];
    for (const rawBlock of rawBlocks) {
      if (
        !Array.isArray(rawBlock) ||
        rawBlock.length !== 2 ||
        typeof rawBlock[0] !== "string" ||
        typeof rawBlock[1] !== "string"
      ) {
        continue;
      }

      const start = timeToMinutes(rawBlock[0]);
      const end = timeToMinutes(rawBlock[1]);
      if (start === null || end === null || end <= start) continue;
      blocks.push([rawBlock[0], rawBlock[1]]);
    }

    if (blocks.length > 0) normalized[key] = blocks;
  }

  return normalized;
}

export function isValidCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addCivilDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function civilDateInTimeZone(date: Date, timezone: string): string {
  const { year, month, day } = civilDatePartsInTimeZone(date, timezone);
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function bookingRangeUtc(
  from: string,
  days: number,
  timezone: string
): { startsAt: Date; endsAt: Date } {
  const [startYear, startMonth, startDay] = from.split("-").map(Number);
  const endDate = addCivilDays(from, days);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  return {
    startsAt: zonedDateTimeToUtc(
      startYear,
      startMonth,
      startDay,
      0,
      0,
      timezone
    ),
    endsAt: zonedDateTimeToUtc(endYear, endMonth, endDay, 0, 0, timezone),
  };
}

function overlaps(
  startsAt: Date,
  endsAt: Date,
  appointment: AppointmentInterval
): boolean {
  const existingStart = new Date(appointment.starts_at).getTime();
  const existingEnd = new Date(appointment.ends_at).getTime();
  return startsAt.getTime() < existingEnd && endsAt.getTime() > existingStart;
}

export function generateAvailableSlots({
  from,
  days,
  durationMinutes,
  businessHours,
  timezone,
  appointments,
  now = new Date(),
  maxSlots = MAX_BOOKING_SLOTS,
}: GenerateSlotsInput): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const durationMs = durationMinutes * 60_000;

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const civilDate = addCivilDays(from, dayOffset);
    const [year, month, day] = civilDate.split("-").map(Number);
    const dayKey = DAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

    for (const [blockStart, blockEnd] of businessHours[dayKey] ?? []) {
      const startMinutes = timeToMinutes(blockStart);
      const endMinutes = timeToMinutes(blockEnd);
      if (startMinutes === null || endMinutes === null) continue;

      // Una grilla fija de 15 minutos permite duraciones flexibles sin perder
      // opciones razonables para el paciente.
      for (
        let candidateMinutes = startMinutes;
        candidateMinutes + durationMinutes <= endMinutes;
        candidateMinutes += BOOKING_SLOT_STEP_MINUTES
      ) {
        const startsAt = zonedDateTimeToUtc(
          year,
          month,
          day,
          Math.floor(candidateMinutes / 60),
          candidateMinutes % 60,
          timezone
        );
        const endsAt = new Date(startsAt.getTime() + durationMs);

        if (startsAt.getTime() <= now.getTime()) continue;
        if (
          appointments.some((appointment) =>
            overlaps(startsAt, endsAt, appointment)
          )
        ) {
          continue;
        }

        slots.push({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        });
        if (slots.length >= maxSlots) return slots;
      }
    }
  }

  return slots;
}

export function isRequestedSlotAvailable({
  startsAt,
  endsAt,
  durationMinutes,
  businessHours,
  timezone,
  appointments,
  now = new Date(),
}: RequestedSlotInput): boolean {
  if (
    endsAt.getTime() - startsAt.getTime() !== durationMinutes * 60_000 ||
    startsAt.getTime() <= now.getTime()
  ) {
    return false;
  }

  const from = civilDateInTimeZone(startsAt, timezone);
  return generateAvailableSlots({
    from,
    days: 1,
    durationMinutes,
    businessHours,
    timezone,
    appointments,
    now,
  }).some(
    (slot) =>
      new Date(slot.starts_at).getTime() === startsAt.getTime() &&
      new Date(slot.ends_at).getTime() === endsAt.getTime()
  );
}
