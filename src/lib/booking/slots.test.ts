import assert from "node:assert/strict";
import { describe, it } from "node:test";

const slotsModule = import(new URL("slots.ts", import.meta.url).href).catch(
  () => null
);

describe("normalizeBusinessHours", () => {
  it("conserva solo bloques HH:MM válidos", async () => {
    const slots = await slotsModule;
    assert.ok(slots, "El helper de slots todavía no existe");

    assert.deepEqual(
      slots.normalizeBusinessHours({
        mon: [
          ["08:00", "12:00"],
          ["14:00", "18:00"],
          ["18:00", "17:00"],
        ],
        tue: "08:00-18:00",
        invalid: [["08:00", "09:00"]],
      }),
      {
        mon: [
          ["08:00", "12:00"],
          ["14:00", "18:00"],
        ],
      }
    );
  });
});

describe("generateAvailableSlots", () => {
  it("genera cada 15 minutos y excluye solapes y huecos pasados", async () => {
    const slots = await slotsModule;
    assert.ok(slots, "El helper de slots todavía no existe");

    const result = slots.generateAvailableSlots({
      from: "2026-08-14",
      days: 1,
      durationMinutes: 30,
      businessHours: { fri: [["08:00", "10:00"]] },
      timezone: "America/Guayaquil",
      appointments: [
        {
          starts_at: "2026-08-14T13:30:00.000Z",
          ends_at: "2026-08-14T14:00:00.000Z",
        },
      ],
      now: new Date("2026-08-14T13:10:00.000Z"),
    });

    assert.deepEqual(result, [
      {
        starts_at: "2026-08-14T14:00:00.000Z",
        ends_at: "2026-08-14T14:30:00.000Z",
      },
      {
        starts_at: "2026-08-14T14:15:00.000Z",
        ends_at: "2026-08-14T14:45:00.000Z",
      },
      {
        starts_at: "2026-08-14T14:30:00.000Z",
        ends_at: "2026-08-14T15:00:00.000Z",
      },
    ]);
  });

  it("respeta bloques partidos y el límite máximo", async () => {
    const slots = await slotsModule;
    assert.ok(slots, "El helper de slots todavía no existe");

    const result = slots.generateAvailableSlots({
      from: "2026-08-17",
      days: 1,
      durationMinutes: 30,
      businessHours: {
        mon: [
          ["08:00", "09:00"],
          ["10:00", "11:00"],
        ],
      },
      timezone: "America/Guayaquil",
      appointments: [],
      now: new Date("2026-08-16T00:00:00.000Z"),
      maxSlots: 2,
    });

    assert.equal(result.length, 2);
    assert.equal(result[0]?.starts_at, "2026-08-17T13:00:00.000Z");
    assert.equal(result[1]?.starts_at, "2026-08-17T13:15:00.000Z");
  });
});

describe("isRequestedSlotAvailable", () => {
  it("solo acepta un candidato generado por la misma grilla", async () => {
    const slots = await slotsModule;
    assert.ok(slots, "El helper de slots todavía no existe");

    const common = {
      durationMinutes: 30,
      businessHours: { fri: [["08:00", "10:00"]] },
      timezone: "America/Guayaquil",
      appointments: [],
      now: new Date("2026-08-13T00:00:00.000Z"),
    };

    assert.equal(
      slots.isRequestedSlotAvailable({
        ...common,
        startsAt: new Date("2026-08-14T13:15:00.000Z"),
        endsAt: new Date("2026-08-14T13:45:00.000Z"),
      }),
      true
    );
    assert.equal(
      slots.isRequestedSlotAvailable({
        ...common,
        startsAt: new Date("2026-08-14T13:10:00.000Z"),
        endsAt: new Date("2026-08-14T13:40:00.000Z"),
      }),
      false
    );
  });
});
