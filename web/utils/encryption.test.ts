import { describe, expect, it } from "vitest";
import { Encryptor } from "./encryption";

describe("encryption", () => {
  it("round trip", async () => {
    const encryptor = new Encryptor("abcd");

    const original = { hello: "world" };

    const tripped = await encryptor.decrypt(await encryptor.encrypt(original));

    expect(original).toStrictEqual(tripped);
  });

  it("throws on error", async () => {
    const encryptor = new Encryptor("abcd");

    const original = { hello: "world" };

    const cipherText = await encryptor.encrypt(original);
    const bad = cipherText.toUpperCase();

    await expect(encryptor.decrypt(bad)).rejects.toThrow();
  });
});
