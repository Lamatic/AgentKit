"use server";

import { lamaticClient } from "@/lib/lamatic-client";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface OrchestrateInput {
    sessionId: string;
    message: string;
    messageType: "chat" | "selection";
    chatHistory: ChatMessage[];
    selectedExcuse: string;
    selectedPerson: string;
}

export async function orchestrateFlow(
    input: OrchestrateInput
): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {

        const workflowId = process.env.LAMATIC_FLOW_ID;

        if (!workflowId) {
            throw new Error("LAMATIC_FLOW_ID is not set in environment variables. Please check your .env.local file.");
        }

        const inputs: Record<string, any> = {
            sessionId: input.sessionId,
            message: input.message,
            messageType: input.messageType,
            chatHistory: input.chatHistory,
            selectedExcuse: input.selectedExcuse,
            selectedPerson: input.selectedPerson,
        };


        // Wrap executeFlow with a 60-second timeout to prevent indefinite hangs
        const executeFlowPromise = lamaticClient.executeFlow(workflowId, inputs);
        const timeoutPromise = new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error("Flow execution timed out")), 60000);
        });

        const resData = await Promise.race([executeFlowPromise, timeoutPromise]);

        let answer: any;

        // Check if the flow is async (returns a requestId instead of the answer)
        if (resData?.result?.requestId) {
            const requestId = resData.result.requestId;
            let statusData: any;
            let isComplete = false;
            
            // Polling loop with bounded retries and exponential backoff
            let retries = 0;
            const maxRetries = 6;
            let delay = 2000; // Initial delay of 2 seconds

            while (retries < maxRetries) {
                // Use a pollTimeout of 10s for the checkStatus call
                statusData = await lamaticClient.checkStatus(requestId, undefined, 10000);

                if (statusData?.status === "error") {
                    throw new Error(statusData.message || "Flow execution failed");
                }

                if (statusData?.status === "success" || statusData?.status === "completed" || (statusData as any)?.data?.output?.result) {
                    isComplete = true;
                    break;
                }

                retries++;
                if (retries < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff (2s, 4s, 8s, 16s, 32s...)
                }
            }

            if (!isComplete) {
                throw new Error("Flow execution timed out after multiple polling attempts");
            }

            // Extract from async status response: data.output.result contains the flow output
            const flowOutput = (statusData as any)?.data?.output?.result;
            answer = flowOutput;
        } else {
            answer = resData?.result;
        }

        if (!answer) {
            throw new Error("No answer found in response");
        }

        // The flow output contains multiple nodes (e.g. excuseGenerator, selectionConfirmed, irrelevant).
        // We need to find the active response node and also check for selectionConfirmed.
        let responseNode: any = null;
        let selectionConfirmedNode: any = null;

        for (const [key, value] of Object.entries(answer)) {
            if (value && typeof value === "object") {
                const node = value as any;

                // Check for the selectionConfirmed node (type === "done")
                if (node.type === "done" || key === "selectionConfirmed") {
                    if (node.message && node.message !== "Skipped the node execution") {
                        selectionConfirmedNode = node;
                    }
                    continue;
                }

                // Find the active response node
                if ("active" in node && node.active === true) {
                    responseNode = node;
                } else if (!responseNode && node.message && node.message !== "Skipped the node execution") {
                    // Fallback: first node with a valid message
                    responseNode = node;
                }
            }
        }


        // Build the data to return — include both response and selectionConfirmed
        const data: any = {};

        if (responseNode) {
            data.response = {
                type: responseNode.type || "question",
                message: responseNode.message || "",
                items: responseNode.items || [],
                person: responseNode.person || "",
            };
        }

        if (selectionConfirmedNode) {
            data.selectionConfirmed = {
                type: selectionConfirmedNode.type || "done",
                message: selectionConfirmedNode.message || "",
            };
        }

        // If we have neither, error
        if (!data.response && !data.selectionConfirmed) {
            throw new Error("No active node with a message found in response");
        }

        return {
            success: true,
            data,
        };
    } catch (error) {

        let errorMessage = "Unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
            if (error.message.includes("fetch failed")) {
                errorMessage =
                    "Network error: Unable to connect to the service. Please check your internet connection and try again.";
            } else if (error.message.includes("API key")) {
                errorMessage = "Authentication error: Please check your API configuration.";
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
