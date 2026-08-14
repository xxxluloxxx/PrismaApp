import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_DURATION_MINUTES,
  bookingRangeUtc,
  civilDateInTimeZone,
  generateAvailableSlots,
  isValidCivilDate,
  normalizeBusinessHours,
} from "@/lib/booking/slots";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/supabase/clinic-timezone";
import { createServiceClient } from "@/lib/supabase/service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const doctorId = params.get("doctor_id")?.trim() ?? "";
    if (!UUID_PATTERN.test(doctorId)) {
      return NextResponse.json(
        { error: "doctor_id debe ser un UUID válido." },
        { status: 400 }
      );
    }

    const durationParam = params.get("duration_minutes");
    const durationMinutes =
      durationParam === null
        ? DEFAULT_BOOKING_DURATION_MINUTES
        : parsePositiveInteger(durationParam);
    if (durationMinutes === null || durationMinutes > 240) {
      return NextResponse.json(
        {
          error:
            "duration_minutes debe ser un entero positivo de hasta 240 minutos.",
        },
        { status: 400 }
      );
    }

    const daysParam = params.get("days");
    const days = daysParam === null ? 14 : parsePositiveInteger(daysParam);
    if (days === null || days > 30) {
      return NextResponse.json(
        { error: "days debe ser un entero entre 1 y 30." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const [doctorResult, settingsResult] = await Promise.all([
      serviceClient
        .from("profiles")
        .select("id")
        .eq("id", doctorId)
        .eq("role", "medico")
        .eq("is_active", true)
        .maybeSingle(),
      serviceClient
        .from("clinic_settings")
        .select("business_hours, timezone")
        .eq("id", true)
        .single(),
    ]);

    if (doctorResult.error || settingsResult.error || !settingsResult.data) {
      console.error("GET /api/public/booking/slots lookup:", {
        doctor: doctorResult.error,
        settings: settingsResult.error,
      });
      return NextResponse.json(
        { error: "No se pudieron calcular los horarios disponibles." },
        { status: 500 }
      );
    }
    if (!doctorResult.data) {
      return NextResponse.json(
        { error: "Médico no disponible." },
        { status: 404 }
      );
    }

    const timezone =
      settingsResult.data.timezone?.trim() || DEFAULT_CLINIC_TIMEZONE;
    const from =
      params.get("from")?.trim() || civilDateInTimeZone(new Date(), timezone);
    if (!isValidCivilDate(from)) {
      return NextResponse.json(
        { error: "from debe tener el formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const range = bookingRangeUtc(from, days, timezone);
    const appointmentsResult = await serviceClient
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("doctor_id", doctorId)
      .in("status", ["scheduled", "confirmed"])
      .lt("starts_at", range.endsAt.toISOString())
      .gt("ends_at", range.startsAt.toISOString());

    if (appointmentsResult.error) {
      console.error(
        "GET /api/public/booking/slots appointments:",
        appointmentsResult.error
      );
      return NextResponse.json(
        { error: "No se pudieron calcular los horarios disponibles." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      doctor_id: doctorId,
      slots: generateAvailableSlots({
        from,
        days,
        durationMinutes,
        businessHours: normalizeBusinessHours(
          settingsResult.data.business_hours
        ),
        timezone,
        appointments: appointmentsResult.data ?? [],
      }),
    });
  } catch (err) {
    console.error("GET /api/public/booking/slots unexpected:", err);
    return NextResponse.json(
      { error: "No se pudieron calcular los horarios disponibles." },
      { status: 500 }
    );
  }
}
