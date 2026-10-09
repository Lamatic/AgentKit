interface SafeErrorContext {
  operation: string;
  errorName: string;
}

export function reportServerError(context: SafeErrorContext): void {
  console.error(JSON.stringify({
    level: "error",
    event: "vehicle_service_advisor_failure",
    ...context,
  }));
}
