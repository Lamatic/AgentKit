import { describe, expect, test } from "bun:test";

import { InvestigationDeadline } from "../lib/deadline";

describe("investigation deadline", () => {
  test("divides remaining route budget across unfinished probes", () => {
    let now = 1_000;
    const deadline = new InvestigationDeadline(100_000, () => now);

    expect(deadline.probeTimeoutSeconds(40, 4)).toBe(25);
    now += 96_000;
    expect(deadline.probeTimeoutSeconds(40, 4)).toBe(1);
    now += 4_000;
    expect(() => deadline.probeTimeoutSeconds(40, 1)).toThrow("execution budget");
  });
});
