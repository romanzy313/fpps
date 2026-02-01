import { describe, it, expect } from "vitest";
import {
  parseRoomParams,
  stringifyRoomParams,
  isValidRoomHash,
} from "./roomParams";

describe("parseRoomParams", () => {
  it("should parse valid room params", () => {
    const input = "m:user123;p:peer456;s:secret789";
    const result = parseRoomParams(input);

    expect(result).toEqual({
      myId: "user123",
      peerId: "peer456",
      secret: "secret789",
    });
  });

  it("should handle missing params", () => {
    const input = "m:user123;p:peer456";
    const result = parseRoomParams(input);

    expect(result).toEqual({
      myId: "user123",
      peerId: "peer456",
      secret: "",
    });
  });

  it("should handle empty string", () => {
    const result = parseRoomParams("");

    expect(result).toEqual({
      myId: "",
      peerId: "",
      secret: "",
    });
  });

  it("should handle malformed input", () => {
    const result = parseRoomParams("garbage");

    expect(result).toEqual({
      myId: "",
      peerId: "",
      secret: "",
    });
  });
});

describe("isValidRoomHash", () => {
  it("should return true for valid hash", () => {
    const hash = "m:user123;p:peer456;s:secret789";
    expect(isValidRoomHash(hash)).toBe(true);
  });

  it("should return false for missing params", () => {
    expect(isValidRoomHash("m:user123;p:peer456")).toBe(false);
    expect(isValidRoomHash("m:user123")).toBe(false);
    expect(isValidRoomHash("")).toBe(false);
  });

  it("should return false for empty values", () => {
    expect(isValidRoomHash("")).toBe(false);
  });
});

describe("stringifyRoomParams", () => {
  it("should round-trip correctly", () => {
    const original = {
      myId: "user123",
      peerId: "peer456",
      secret: "secret789",
    };

    const stringified = stringifyRoomParams(original);
    const parsed = parseRoomParams(stringified);

    expect(parsed).toEqual(original);
  });
});
