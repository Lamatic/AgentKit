import { z } from "zod";

const exitCodeAssertionSchema = z.object({
  kind: z.literal("exit_code"),
  equals: z.number().int(),
});

const outputAssertionSchema = z.object({
  kind: z.enum(["stdout_contains", "stderr_contains"]),
  value: z.string().min(1).max(2_000),
});

export const probeSpecSchema = z.object({
  command: z.string().trim().min(1).max(4_000),
  assertions: z
    .array(z.discriminatedUnion("kind", [exitCodeAssertionSchema, outputAssertionSchema]))
    .min(1)
    .max(10),
});

export const commandObservationSchema = z.object({
  exitCode: z.number().int(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number().int().nonnegative(),
});

export type ProbeSpec = z.infer<typeof probeSpecSchema>;
export type CommandObservation = z.infer<typeof commandObservationSchema>;

export function evaluateProbe(
  probe: ProbeSpec,
  observation: CommandObservation,
) {
  const assertions = probe.assertions.map((assertion) => {
    if (assertion.kind === "exit_code") {
      return {
        kind: assertion.kind,
        passed: observation.exitCode === assertion.equals,
        expected: assertion.equals,
        actual: observation.exitCode,
      };
    }

    const actual =
      assertion.kind === "stdout_contains"
        ? observation.stdout
        : observation.stderr;

    return {
      kind: assertion.kind,
      passed: actual.includes(assertion.value),
      expected: assertion.value,
      actual,
    };
  });

  return {
    passed: assertions.every(({ passed }) => passed),
    assertions,
    observation: {
      command: probe.command,
      ...observation,
    },
  };
}
