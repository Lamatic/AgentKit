import { beforeEach, describe, expect, test } from "bun:test";

import {
  acquireInvestigationSlot,
  resetInvestigationSlotsForTest,
} from "../lib/concurrency";

describe("investigation concurrency fallback", () => {
  beforeEach(resetInvestigationSlotsForTest);

  test("bounds expensive work per application instance", () => {
    const releaseFirst = acquireInvestigationSlot();
    const releaseSecond = acquireInvestigationSlot();

    expect(releaseFirst).toBeFunction();
    expect(releaseSecond).toBeFunction();
    expect(acquireInvestigationSlot()).toBeNull();

    releaseFirst?.();
    expect(acquireInvestigationSlot()).toBeFunction();
  });
});
