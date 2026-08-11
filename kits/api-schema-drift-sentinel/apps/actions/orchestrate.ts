"use server";

import { runOpenApiDiff, normalizeDiff, triggerLamaticWorkflow } from '../lib/sentinel';

export async function analyzeSchemaDrift(
  oldSpecContent: string,
  newSpecContent: string,
  apiName = "Target API",
  oldVersion = "1.0.0",
  newVersion = "2.0.0"
) {
  try {
    const rawDiff = await runOpenApiDiff(oldSpecContent, newSpecContent);
    const normalizedChanges = normalizeDiff(rawDiff);

    const payload = {
      apiName,
      oldVersion,
      newVersion,
      changesCount: normalizedChanges.allChanges.length,
      changes: normalizedChanges.allChanges
    };

    const data = await triggerLamaticWorkflow(payload);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}