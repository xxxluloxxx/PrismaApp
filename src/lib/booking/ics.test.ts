import assert from "node:assert/strict";
import { describe, it } from "node:test";

const icsModule = import(new URL("ics.ts", import.meta.url).href).catch(
  () => null
);

describe("createAppointmentIcs", () => {
  it("genera un calendario UTC válido y escapa el contenido", async () => {
    const mod = await icsModule;
    assert.ok(mod, "Debe existir el módulo ICS");

    const ics = mod.createAppointmentIcs({
      appointmentId: "appointment-123",
      startsAt: "2026-08-20T15:30:00.000Z",
      endsAt: "2026-08-20T16:15:00.000Z",
      doctorName: "Dra. Ana, Pérez",
      treatmentName: "Limpieza; control",
    });

    assert.match(ics, /BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
    assert.match(ics, /DTSTART:20260820T153000Z\r\n/);
    assert.match(ics, /DTEND:20260820T161500Z\r\n/);
    assert.match(ics, /UID:appointment-123@prismaapp\r\n/);
    assert.match(ics, /SUMMARY:Limpieza\\; control - PrismaApp\r\n/);
    assert.match(ics, /DESCRIPTION:Cita con Dra\. Ana\\, Pérez\r\n/);
    assert.match(ics, /END:VCALENDAR\r\n$/);
  });

  it("usa un título genérico cuando no hay tratamiento", async () => {
    const mod = await icsModule;
    assert.ok(mod, "Debe existir el módulo ICS");

    const ics = mod.createAppointmentIcs({
      appointmentId: "appointment-456",
      startsAt: "2026-08-21T14:00:00Z",
      endsAt: "2026-08-21T14:30:00Z",
      doctorName: "Dr. Luis Andrade",
      treatmentName: null,
    });

    assert.match(ics, /SUMMARY:Cita odontológica - PrismaApp\r\n/);
  });
});
