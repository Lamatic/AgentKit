import { z } from "zod";

const requiredText = z.string().trim().min(1).max(2_000);
const optionalText = z.string().trim().max(2_000);

export const assessmentInputSchema = z.object({
  make: requiredText.max(80),
  model: requiredText.max(80),
  year: z.string().regex(/^\d{4}$/, "Enter a four-digit year"),
  mileage: requiredText.max(40),
  fuelType: requiredText.max(40),
  symptoms: requiredText.min(10).max(2_000),
  warningLights: optionalText,
  recentService: optionalText,
  drivability: z.enum(["normal", "limited", "immobile"]),
});

const possibleCauseSchema = z.object({
  cause: requiredText,
  likelihood: z.enum(["low", "medium", "high"]),
  evidence: requiredText,
});

const inspectionStepSchema = z.object({
  priority: z.coerce.number().int().positive(),
  action: requiredText,
  performed_by: z.enum(["owner", "technician"]),
  reason: requiredText,
});

export const flowReportSchema = z
  .object({
    summary: requiredText,
    urgency: z.enum(["stop_now", "urgent", "soon", "monitor"]),
    stop_driving: z.boolean(),
    confidence: z.enum(["low", "medium", "high"]),
    safety_message: requiredText,
    possible_causes: z.array(possibleCauseSchema).max(4),
    clarifying_questions: z.array(requiredText).max(8),
    inspection_plan: z.array(inspectionStepSchema).max(6),
    owner_actions: z.array(requiredText).max(8),
    mechanic_brief: requiredText,
    limitations: requiredText,
  })
  .superRefine((report, context) => {
    const shouldStopDriving = report.urgency === "stop_now";
    if (report.stop_driving === shouldStopDriving) return;

    context.addIssue({
      code: "custom",
      message: "stop_driving must be true exactly when urgency is stop_now",
      path: ["stop_driving"],
    });
  });

export type FlowReport = z.infer<typeof flowReportSchema>;
