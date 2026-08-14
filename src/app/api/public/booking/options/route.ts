import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_DURATION_MINUTES,
  normalizeBusinessHours,
} from "@/lib/booking/slots";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/supabase/clinic-timezone";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const serviceClient = createServiceClient();
    const [doctorsResult, treatmentsResult, settingsResult] = await Promise.all([
      serviceClient
        .from("profiles")
        .select("id, full_name, specialty")
        .eq("role", "medico")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      serviceClient
        .from("treatments")
        .select("id, name, duration_minutes")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      serviceClient
        .from("clinic_settings")
        .select("business_hours, timezone")
        .eq("id", true)
        .single(),
    ]);

    if (
      doctorsResult.error ||
      treatmentsResult.error ||
      settingsResult.error ||
      !settingsResult.data
    ) {
      console.error("GET /api/public/booking/options query:", {
        doctors: doctorsResult.error,
        treatments: treatmentsResult.error,
        settings: settingsResult.error,
      });
      return NextResponse.json(
        { error: "No se pudieron cargar las opciones de reserva." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      doctors: doctorsResult.data ?? [],
      treatments: treatmentsResult.data ?? [],
      business_hours: normalizeBusinessHours(
        settingsResult.data.business_hours
      ),
      timezone:
        settingsResult.data.timezone?.trim() || DEFAULT_CLINIC_TIMEZONE,
      // Duración estándar para reservas que no seleccionan tratamiento.
      default_duration_minutes: DEFAULT_BOOKING_DURATION_MINUTES,
    });
  } catch (err) {
    console.error("GET /api/public/booking/options unexpected:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar las opciones de reserva." },
      { status: 500 }
    );
  }
}
