"use server";

import lamaticConfig from "../../lamatic.config";

/** Structural entrypoint: reflects the kit's configured flow steps. */
export async function orchestrate(): Promise<{ success: boolean; message: string }> {
  const steps = lamaticConfig.steps ?? [];
  const names = steps.map((s) => s.id).join(", ");
  return {
    success: true,
    message: `Orchestration is handled by the engine. Kit defines ${steps.length} flows: ${names}.`,
  };
}
