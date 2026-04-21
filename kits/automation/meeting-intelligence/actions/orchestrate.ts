"use server";
import { executeFlow } from "@/lib/lamatic-client";

export async function analyzeMeeting(meetingNotes: string, recipientEmail: string) {
  // We use executeFlow from your lib folder instead of raw fetch
  const result = await executeFlow(
    process.env.LAMATIC_FLOW_ID!,
    { meetingNotes, recipientEmail }
  );
  return result ?? { error: "No result" };
}
