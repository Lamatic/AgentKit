const maximumConcurrentInvestigations = 2;
let activeInvestigations = 0;

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

export function resetInvestigationSlotsForTest() {
  activeInvestigations = 0;
}
