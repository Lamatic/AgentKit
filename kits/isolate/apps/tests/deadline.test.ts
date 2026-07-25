import { describe, expect, test } from "bun:test";

import { InvestigationDeadline } from "../lib/deadline";

describe("investigation deadline", () => {
  test("divides remaining route budget across unfinished probes", () => {
    let now = 1_000;
    const deadline = new InvestigationDeadline(100_000, () => now);

    expect(deadline.probeTimeoutSeconds(40, 4)).toBe(16);
    now += 60_000;
    expect(deadline.probeTimeoutSeconds(40, 4)).toBe(1);
    now += 5_000;
    expect(() => deadline.probeTimeoutSeconds(40, 1)).toThrow("execution budget");
  });

  test("aborts provider work when the aggregate budget expires", async () => {
    const deadline = new InvestigationDeadline(20);
    let aborted = false;

    await expect(
      deadline.run(
        (signal) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => {
              aborted = true;
              reject(signal.reason);
            });
          }),
        { maximumMilliseconds: 1_000, cleanupReserveMilliseconds: 0 },
      ),
    ).rejects.toThrow("execution budget");
    expect(aborted).toBe(true);
  });
});
