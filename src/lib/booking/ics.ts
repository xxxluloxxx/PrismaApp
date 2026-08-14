export type AppointmentIcsData = {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  doctorName: string;
  treatmentName: string | null;
};

function formatUtcDate(value: string): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createAppointmentIcs(data: AppointmentIcsData): string {
  const summary = data.treatmentName
    ? `${data.treatmentName} - PrismaApp`
    : "Cita odontológica - PrismaApp";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PrismaApp//Reserva odontológica//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(data.appointmentId)}@prismaapp`,
    `DTSTAMP:${formatUtcDate(new Date().toISOString())}`,
    `DTSTART:${formatUtcDate(data.startsAt)}`,
    `DTEND:${formatUtcDate(data.endsAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(`Cita con ${data.doctorName}`)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadAppointmentIcs(
  data: AppointmentIcsData,
  filename = "cita-prismaapp.ics"
): void {
  const blob = new Blob([createAppointmentIcs(data)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
