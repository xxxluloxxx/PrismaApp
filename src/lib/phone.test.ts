import assert from "node:assert/strict";
import { describe, it } from "node:test";

const phoneModule = import(new URL("phone.ts", import.meta.url).href).catch(
  () => null
);

describe("normalizeEcuadorPhone", () => {
  it("normaliza formatos nacionales e internacionales válidos", async () => {
    const phone = await phoneModule;
    assert.ok(phone, "La utilidad de teléfono todavía no existe");

    assert.equal(phone.normalizeEcuadorPhone("0987654321"), "593987654321");
    assert.equal(
      phone.normalizeEcuadorPhone("+593 98 765 4321"),
      "593987654321"
    );
    assert.equal(phone.normalizeEcuadorPhone("987654321"), "593987654321");
    assert.equal(phone.normalizeEcuadorPhone("02 234 5678"), "59322345678");
    assert.equal(phone.normalizeEcuadorPhone("22345678"), "59322345678");
  });

  it("rechaza números cuya parte nacional no tiene 8 o 9 dígitos", async () => {
    const phone = await phoneModule;
    assert.ok(phone, "La utilidad de teléfono todavía no existe");

    assert.equal(phone.normalizeEcuadorPhone(null), null);
    assert.equal(phone.normalizeEcuadorPhone(""), null);
    assert.equal(phone.normalizeEcuadorPhone("1234567"), null);
    assert.equal(phone.normalizeEcuadorPhone("5931234567890"), null);
  });
});

describe("isValidEcuadorPhone", () => {
  it("refleja si el teléfono se puede normalizar", async () => {
    const phone = await phoneModule;
    assert.ok(phone, "La utilidad de teléfono todavía no existe");

    assert.equal(phone.isValidEcuadorPhone("0987654321"), true);
    assert.equal(phone.isValidEcuadorPhone("123"), false);
  });
});
