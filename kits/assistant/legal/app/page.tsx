import { Header } from "@/components/header"
import { LegalAskWidget } from "@/components/legal-ask-widget"
import { Card } from "@/components/ui/card"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

type TriggerNodeId = "askTriggerNode" | "chatTriggerNode" | "unknown"

function getTriggerType(): TriggerNodeId {
  try {
    const candidates = [
      join(process.cwd(), "flows", "assistant-legal-advisor", "config.json"),
      join(process.cwd(), "kits", "assistant", "legal", "flows", "assistant-legal-advisor", "config.json"),
    ]
    const flowPath = candidates.find((path) => existsSync(path))
    if (!flowPath) {
      return "unknown"
    }
    const parsed = JSON.parse(readFileSync(flowPath, "utf-8")) as {
      nodes?: Array<{ data?: { nodeId?: string } }>
    }
    const nodeId = parsed.nodes?.find((node) => node?.data?.nodeId?.includes("TriggerNode"))?.data?.nodeId

    if (nodeId === "askTriggerNode" || nodeId === "chatTriggerNode") {
      return nodeId
    }
    return "unknown"
  } catch {
    return "unknown"
  }
}

export default function LegalAssistantPage() {
  const flowId = process.env.ASSISTANT_LEGAL_ADVISOR ?? ""
  const apiUrl = process.env.LAMATIC_API_URL ?? ""
  const projectId = process.env.LAMATIC_PROJECT_ID ?? ""
  const triggerType = getTriggerType()

  const missing = [
    !flowId ? "ASSISTANT_LEGAL_ADVISOR" : null,
    !apiUrl ? "LAMATIC_API_URL" : null,
    !projectId ? "LAMATIC_PROJECT_ID" : null,
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-zinc-50 to-amber-50 text-foreground">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Card className="mb-6 border-amber-200 bg-amber-50/80 shadow-sm">
          <div className="p-4 text-sm text-amber-900">
            <strong>Important:</strong> This assistant provides legal information, not legal advice. Always consult a
            licensed attorney before making legal decisions.
          </div>
        </Card>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-normal mb-3 text-balance">Legal Assistant</h1>
          <p className="text-lg text-muted-foreground">
            This kit is configured to use the Lamatic Ask Widget with your deployed ask-trigger flow.
          </p>
        </div>

        {missing.length > 0 ? (
          <Card className="p-6 border-red-200 bg-red-50 text-red-800">
            <p className="font-medium mb-2">Missing required environment variables:</p>
            <p>{missing.join(", ")}</p>
          </Card>
        ) : (
          <LegalAskWidget flowId={flowId} apiUrl={apiUrl} projectId={projectId} triggerType={triggerType} />
        )}
      </div>
    </div>
  )
}
