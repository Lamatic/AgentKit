export class InvestigationDeadline {
  private readonly expiresAt: number;

  constructor(
    totalMilliseconds = 150_000,
    private readonly now: () => number = Date.now,
  ) {
    this.expiresAt = this.now() + totalMilliseconds;
  }

  probeTimeoutSeconds(maximumSeconds: number, probesRemaining = 1) {
    const remainingSeconds = Math.floor(
      (this.expiresAt - this.now()) / 1_000 / probesRemaining,
    );
    if (remainingSeconds < 1) {
      throw new Error("The investigation exceeded its execution budget.");
    }
    return Math.min(maximumSeconds, remainingSeconds);
  }
}
