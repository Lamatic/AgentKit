const maximumConcurrentInvestigations = 2;
let activeInvestigations = 0;

/**
 * Claim one of the process-local investigation slots.
 *
 * The bound is instance-scoped: on an autoscaled deployment it limits work per
 * instance, not in aggregate. Deployment-wide limits belong at the edge or in the
 * Daytona account quota (see the kit README).
 *
 * @returns an idempotent release function, or `null` when no slot is free.
 */
export function acquireInvestigationSlot() {
  if (activeInvestigations >= maximumConcurrentInvestigations) return null;
  activeInvestigations += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeInvestigations = Math.max(0, activeInvestigations - 1);
  };
}

/**
 * Reset the slot counter between tests.
 */
export function resetInvestigationSlotsForTest() {
  activeInvestigations = 0;
}
