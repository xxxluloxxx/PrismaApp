import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

const clientModule = import(new URL("client.ts", import.meta.url).href).catch(
  () => null
);

const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator"
);
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNotification = Object.getOwnPropertyDescriptor(
  globalThis,
  "Notification"
);

function restoreGlobal(
  name: "navigator" | "window" | "Notification",
  descriptor: PropertyDescriptor | undefined
) {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    Reflect.deleteProperty(globalThis, name);
  }
}

afterEach(() => {
  restoreGlobal("navigator", originalNavigator);
  restoreGlobal("window", originalWindow);
  restoreGlobal("Notification", originalNotification);
});

describe("urlBase64ToUint8Array", () => {
  it("convierte una clave VAPID base64url a bytes", async () => {
    const client = await clientModule;
    assert.ok(client, "La utilidad push de cliente todavía no existe");

    assert.deepEqual(
      Array.from(client.urlBase64ToUint8Array("AQIDBA")),
      [1, 2, 3, 4]
    );
    assert.deepEqual(Array.from(client.urlBase64ToUint8Array("-_8")), [251, 255]);
  });
});

describe("isPushSupported", () => {
  it("solo devuelve true cuando existen las tres APIs requeridas", async () => {
    const client = await clientModule;
    assert.ok(client, "La utilidad push de cliente todavía no existe");

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { serviceWorker: {} },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        PushManager: class PushManager {},
        Notification: class Notification {},
      },
    });

    assert.equal(client.isPushSupported(), true);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    assert.equal(client.isPushSupported(), false);
  });
});
