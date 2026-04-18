"use server";

import { createLamaticClient } from "@/lib/lamatic-client";

const client = createLamaticClient();

export async function preprocessTimeSeries(datasetSummary: string) {
  try {
    const response = await client.executeFlow({
      flowId: process.env.TIME_SERIES_PREPROCESSOR!,
      inputs: {
        dataset_summary: datasetSummary,
      },
    });

    return {
      success: true,
      result: response?.data?.generatedText || "",
    };
  } catch (error) {
    console.error("Error calling Lamatic flow:", error);
    return {
      success: false,
      result: "Failed to generate preprocessing pipeline. Please try again.",
    };
  }
}