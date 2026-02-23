import { describe, it, expect } from "vitest";
import {
  generateRoomParams,
  parseRoomParams,
  stringifyRoomParams,
} from "./roomParams";

describe("parseRoomParams", () => {
  it("should parse valid room params", () => {
    const input = `m:user123_____________;p:peer456_____________;s:secret789___________`;
    const result = parseRoomParams(input);

    expect(result).toEqual({
      myId: "user123_____________",
      peerId: "peer456_____________",
      secret: "secret789___________",
    });
  });

  it("should parse with full urlvalid room params", () => {
    const input = `https://example.com/room#m:${"user123".padEnd(20, "_")};p:${"peer456".padEnd(20, "_")};s:${"secret789".padEnd(20, "_")}`;
    const result = parseRoomParams(input);

    expect(result).toEqual({
      myId: "user123".padEnd(20, "_"),
      peerId: "peer456".padEnd(20, "_"),
      secret: "secret789".padEnd(20, "_"),
    });
  });

  it("should handle missing params", () => {
    const input = "m:user123;p:peer456";
    const result = parseRoomParams(input);

    expect(result).toEqual(null);
  });

  it("should handle empty string", () => {
    const result = parseRoomParams("");

    expect(result).toEqual(null);
  });

  it("should handle malformed input", () => {
    const result = parseRoomParams("garbage");

    expect(result).toEqual(null);
  });
});

describe("stringifyRoomParams", () => {
  it("should round-trip correctly", () => {
    const original = {
      myId: "user123".padEnd(20, "_"),
      peerId: "peer456".padEnd(20, "_"),
      secret: "secret789".padEnd(20, "_"),
    };

    const stringified = stringifyRoomParams(original);
    const parsed = parseRoomParams(stringified);

    expect(parsed).toEqual(original);
  });
});

describe("generateRoomParams", () => {
  it("should round-trip correctly", () => {
    const original = generateRoomParams();

    const stringified = stringifyRoomParams(original);
    const parsed = parseRoomParams(stringified);

    expect(parsed).toEqual(original);
  });
});
