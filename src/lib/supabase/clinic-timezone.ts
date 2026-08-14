export const DEFAULT_CLINIC_TIMEZONE = "America/Guayaquil";

export async function resolveClinicTimezone(): Promise<string> {
  try {
    const { getClinicSettings } = await import(
      "@/lib/supabase/clinic-settings"
    );
    const result = await getClinicSettings();
    const tz = result.data?.timezone?.trim();
    return tz || DEFAULT_CLINIC_TIMEZONE;
  } catch {
    return DEFAULT_CLINIC_TIMEZONE;
  }
}

export function civilDatePartsInTimeZone(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Offset of `timeZone` at `instant`: ms to add to UTC to get local wall time. */
export function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUTC - instant.getTime();
}

/** UTC instant for a civil date and time in `timeZone`. */
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
  const corrected = new Date(localAsUtc - offset);
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  return new Date(localAsUtc - offset2);
}

/** UTC instant for civil Y-M-D 00:00:00 in `timeZone`. */
export function zonedMidnightToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string
): Date {
  return zonedDateTimeToUtc(year, month, day, 0, 0, timeZone);
}
