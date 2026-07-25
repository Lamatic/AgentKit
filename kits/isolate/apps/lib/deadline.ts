export class InvestigationDeadline {
  private readonly expiresAt: number;

  constructor(
    totalMilliseconds = 150_000,
    private readonly now: () => number = Date.now,
  ) {
    this.expiresAt = this.now() + totalMilliseconds;
  }

  remainingMilliseconds(cleanupReserveMilliseconds = 0) {
    const remaining =
      this.expiresAt - this.now() - cleanupReserveMilliseconds;
    if (remaining < 1) {
      throw new Error("The investigation exceeded its execution budget.");
    }
    return remaining;
  }

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
