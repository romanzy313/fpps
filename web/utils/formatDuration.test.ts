import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  const cases: [number, string][] = [
    [5, " 5 sec"],
    [10, "10 sec"],
    [59, "59 sec"],
    [60, " 1 min"],
    [90, " 1 min"],
    [600, "10 min"],
    [3600, "1.0 hr"],
    [5400, "1.5 hr"],
    [9 * 3600, "9.0 hr"],
    [10 * 3600, "     ∞"],
    [99 * 3600, "     ∞"],
  ];

  it.each(cases)("formatDuration(%i) === %j", (seconds, expected) => {
    const result = formatDuration(seconds);
    expect(result).toBe(expected);
    expect(result).toHaveLength(6);
  });
});
