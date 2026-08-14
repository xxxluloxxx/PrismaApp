import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_DURATION_MINUTES,
  isRequestedSlotAvailable,
  normalizeBusinessHours,
} from "@/lib/booking/slots";
import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/supabase/clinic-timezone";
import { createServiceClient } from "@/lib/supabase/service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_INSTANT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const RATE_LIMIT_WINDOW_MS = 15 * 60_000;
const MINIMUM_ADVANCE_MS = 5 * 60_000;

type ServiceClient = ReturnType<typeof createServiceClient>;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  return (
    firstForwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  ).toLowerCase();
}

async function countRecentAttempts(
  serviceClient: ServiceClient,
  identifier: string,
  since: string
): Promise<number> {
  const { count, error } = await serviceClient
    .from("public_booking_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gte("created_at", since);

  if (error) throw new Error(`No se pudo consultar el rate limit: ${error.message}`);
  return count ?? 0;
}

async function findPatientId(
  serviceClient: ServiceClient,
  field: "document_id" | "phone",
  value: string
): Promise<string | null> {
  const { data, error } = await serviceClient
    .from("patients")
    .select("id")
    .eq(field, value)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo buscar el paciente: ${error.message}`);
  }
  return data?.id ?? null;
}

export async function POST(request: Request) {
  try {
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return jsonError("El cuerpo de la solicitud no es JSON válido.", 400);
    }

    if (!isRecord(parsedBody)) {
      return jsonError("El cuerpo de la solicitud no es válido.", 400);
    }

    // El honeypot se evalúa antes de crear el cliente service role: una
    // solicitud bot no consulta, inserta ni limpia ninguna fila.
    if (
      trimmedString(parsedBody.website) ||
      (parsedBody.website !== undefined &&
        parsedBody.website !== null &&
        typeof parsedBody.website !== "string")
    ) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const rawPatient = isRecord(parsedBody.patient)
      ? parsedBody.patient
      : null;
    const rawPhone = trimmedString(rawPatient?.phone);
    const normalizedPhone = rawPhone.replace(/\D/g, "");
    const ipIdentifier = requestIp(request);
    const phoneIdentifier = normalizedPhone
      ? `phone:${normalizedPhone}`
      : null;

    const serviceClient = createServiceClient();
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const ipAttempts = await countRecentAttempts(
      serviceClient,
      ipIdentifier,
      since
    );
    if (ipAttempts >= 8) {
      return jsonError(
        "Demasiados intentos, espera unos minutos e inténtalo de nuevo.",
        429
      );
    }

    if (
      phoneIdentifier &&
      (await countRecentAttempts(serviceClient, phoneIdentifier, since)) >= 4
    ) {
      return jsonError(
        "Demasiados intentos, espera unos minutos e inténtalo de nuevo.",
        429
      );
    }

    const attemptIdentifiers = [
      { identifier: ipIdentifier },
      ...(phoneIdentifier ? [{ identifier: phoneIdentifier }] : []),
    ];
    const { error: attemptError } = await serviceClient
      .from("public_booking_attempts")
      .insert(attemptIdentifiers);
    if (attemptError) {
      throw new Error(
        `No se pudo registrar el intento de reserva: ${attemptError.message}`
      );
    }

    const cleanupBefore = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { error: cleanupError } = await serviceClient
      .from("public_booking_attempts")
      .delete()
      .lt("created_at", cleanupBefore);
    if (cleanupError) {
      console.error(
        "POST /api/public/appointments rate-limit cleanup:",
        cleanupError
      );
    }

    const doctorId = trimmedString(parsedBody.doctor_id);
    if (!UUID_PATTERN.test(doctorId)) {
      return jsonError("doctor_id debe ser un UUID válido.", 400);
    }

    const treatmentId = trimmedString(parsedBody.treatment_id);
    if (parsedBody.treatment_id !== undefined && !UUID_PATTERN.test(treatmentId)) {
      return jsonError("treatment_id debe ser un UUID válido.", 400);
    }

    const startsAtRaw = trimmedString(parsedBody.starts_at);
    const startsAt = new Date(startsAtRaw);
    if (
      !ISO_INSTANT_PATTERN.test(startsAtRaw) ||
      Number.isNaN(startsAt.getTime())
    ) {
      return jsonError("starts_at debe ser una fecha ISO 8601 válida.", 400);
    }
    if (startsAt.getTime() < Date.now() + MINIMUM_ADVANCE_MS) {
      return jsonError(
        "starts_at debe estar al menos 5 minutos en el futuro.",
        400
      );
    }

    let requestedDuration: number | null = null;
    if (parsedBody.duration_minutes !== undefined) {
      if (
        typeof parsedBody.duration_minutes !== "number" ||
        !Number.isInteger(parsedBody.duration_minutes) ||
        parsedBody.duration_minutes <= 0 ||
        parsedBody.duration_minutes > 240
      ) {
        return jsonError(
          "duration_minutes debe ser un entero positivo de hasta 240 minutos.",
          400
        );
      }
      requestedDuration = parsedBody.duration_minutes;
    }

    if (!rawPatient) {
      return jsonError("patient es obligatorio.", 400);
    }
    const documentId = trimmedString(rawPatient.document_id);
    const firstName = trimmedString(rawPatient.first_name);
    const lastName = trimmedString(rawPatient.last_name);
    const phone = trimmedString(rawPatient.phone);
    const email = trimmedString(rawPatient.email);

    if (!documentId) return jsonError("patient.document_id es obligatorio.", 400);
    if (!firstName) return jsonError("patient.first_name es obligatorio.", 400);
    if (!lastName) return jsonError("patient.last_name es obligatorio.", 400);
    if (!phone) return jsonError("patient.phone es obligatorio.", 400);
    if (
      rawPatient.email !== undefined &&
      (typeof rawPatient.email !== "string" || !EMAIL_PATTERN.test(email))
    ) {
      return jsonError("patient.email no es válido.", 400);
    }

    let treatmentName: string | null = null;
    let treatmentDuration: number | null = null;
    if (treatmentId) {
      const { data: treatment, error: treatmentError } = await serviceClient
        .from("treatments")
        .select("name, duration_minutes")
        .eq("id", treatmentId)
        .eq("is_active", true)
        .maybeSingle();

      if (treatmentError) {
        throw new Error(
          `No se pudo consultar el tratamiento: ${treatmentError.message}`
        );
      }
      if (!treatment) {
        return jsonError("Tratamiento no disponible.", 404);
      }
      treatmentName = treatment.name;
      treatmentDuration =
        treatment.duration_minutes === null
          ? null
          : Number(treatment.duration_minutes);
    }

    const durationMinutes =
      requestedDuration ??
      treatmentDuration ??
      DEFAULT_BOOKING_DURATION_MINUTES;
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0 ||
      durationMinutes > 240
    ) {
      return jsonError("La duración de la reserva no es válida.", 400);
    }
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

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

    if (doctorResult.error) {
      throw new Error(
        `No se pudo consultar el médico: ${doctorResult.error.message}`
      );
    }
    if (!doctorResult.data) {
      return jsonError("Médico no disponible", 404);
    }
    if (settingsResult.error || !settingsResult.data) {
      throw new Error(
        `No se pudo consultar la configuración: ${
          settingsResult.error?.message ?? "sin datos"
        }`
      );
    }

    const appointmentsResult = await serviceClient
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("doctor_id", doctorId)
      .in("status", ["scheduled", "confirmed"])
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString());
    if (appointmentsResult.error) {
      throw new Error(
        `No se pudo consultar la agenda: ${appointmentsResult.error.message}`
      );
    }

    const timezone =
      settingsResult.data.timezone?.trim() || DEFAULT_CLINIC_TIMEZONE;
    if (
      !isRequestedSlotAvailable({
        startsAt,
        endsAt,
        durationMinutes,
        businessHours: normalizeBusinessHours(
          settingsResult.data.business_hours
        ),
        timezone,
        appointments: appointmentsResult.data ?? [],
      })
    ) {
      return jsonError(
        "Ese horario ya no está disponible, elige otro.",
        409
      );
    }

    let patientId =
      (await findPatientId(
        serviceClient,
        "document_id",
        documentId
      )) ?? (await findPatientId(serviceClient, "phone", phone));

    if (!patientId) {
      const { data: createdPatient, error: patientError } = await serviceClient
        .from("patients")
        .insert({
          document_id: documentId,
          first_name: firstName,
          last_name: lastName,
          phone,
          email: email || null,
          is_active: true,
          created_by: null,
        })
        .select("id")
        .single();

      if (patientError?.code === "23505") {
        patientId = await findPatientId(
          serviceClient,
          "document_id",
          documentId
        );
        if (!patientId) {
          throw new Error(
            "El paciente entró en conflicto pero no pudo recuperarse."
          );
        }
      } else if (patientError || !createdPatient) {
        throw new Error(
          `No se pudo crear el paciente: ${
            patientError?.message ?? "sin datos"
          }`
        );
      } else {
        patientId = createdPatient.id;
      }
    }

    const { data: appointment, error: appointmentError } = await serviceClient
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "scheduled",
        source: "online",
        reason: treatmentName,
        created_by: null,
      })
      .select("id, patient_id, doctor_id, starts_at, ends_at, status")
      .single();

    if (appointmentError) {
      if (
        appointmentError.code === "P0001" ||
        appointmentError.code === "23P01" ||
        appointmentError.message.toLowerCase().includes("ya tiene una cita")
      ) {
        return jsonError(
          "Ese horario ya no está disponible, elige otro.",
          409
        );
      }
      throw new Error(
        `No se pudo crear la cita: ${appointmentError.message}`
      );
    }
    if (!appointment) {
      throw new Error("La cita se creó sin devolver datos.");
    }

    return NextResponse.json(
      {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        status: "scheduled" as const,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/public/appointments unexpected:", err);
    return jsonError("No se pudo completar la reserva.", 500);
  }
}
