/**
 * Aggregate wall-clock budget for one investigation.
 *
 * Every remote call (Lamatic, GitHub, Daytona) draws from this single budget so a
 * slow provider cannot push the request past the platform function timeout and
 * leave a sandbox running. A cleanup reserve is withheld from every draw so the
 * sandbox can always be deleted.
 */
export class InvestigationDeadline {
  private readonly expiresAt: number;

  constructor(
    totalMilliseconds = 220_000,
    private readonly now: () => number = Date.now,
  ) {
    this.expiresAt = this.now() + totalMilliseconds;
  }

  /**
   * Milliseconds left in the budget after withholding a cleanup reserve.
   *
   * @throws when the budget is already exhausted.
   */
  remainingMilliseconds(cleanupReserveMilliseconds = 0) {
    const remaining =
      this.expiresAt - this.now() - cleanupReserveMilliseconds;
    if (remaining < 1) {
      throw new Error("The investigation exceeded its execution budget.");
    }
    return remaining;
  }

  /**
   * Run an operation under the smaller of its own maximum and the remaining budget.
   *
   * The operation receives an `AbortSignal` that fires when the budget expires, so
   * in-flight fetches are cancelled rather than abandoned.
   */
  async run<T>(
    operation: (signal: AbortSignal, timeoutMilliseconds: number) => Promise<T>,
    options: {
      maximumMilliseconds: number;
      cleanupReserveMilliseconds?: number;
    },
  ) {
    const timeoutMilliseconds = Math.min(
      options.maximumMilliseconds,
      this.remainingMilliseconds(options.cleanupReserveMilliseconds ?? 35_000),
    );
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutError = new Error(
      "The investigation exceeded its execution budget.",
    );

    try {
      return await Promise.race([
        operation(controller.signal, timeoutMilliseconds),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort(timeoutError);
            reject(timeoutError);
          }, timeoutMilliseconds);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Per-probe timeout in seconds, dividing the remaining budget across the probes
   * still to run so a single slow probe cannot starve the ones after it.
   */
  probeTimeoutSeconds(maximumSeconds: number, probesRemaining = 1) {
    const remainingSeconds = Math.floor(
      this.remainingMilliseconds(35_000) / 1_000 / probesRemaining,
    );
    if (remainingSeconds < 1) {
      throw new Error("The investigation exceeded its execution budget.");
    }
    return Math.min(maximumSeconds, remainingSeconds);
  }
}
