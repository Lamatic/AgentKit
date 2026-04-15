"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

type LegalAskWidgetProps = {
  flowId: string
  apiUrl: string
  projectId: string
  triggerType: "askTriggerNode" | "chatTriggerNode" | "unknown"
}

export function LegalAskWidget({ flowId, apiUrl, projectId, triggerType }: LegalAskWidgetProps) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const configError =
    !flowId || !apiUrl || !projectId
      ? "Missing Flow ID, API URL, or Project ID for Ask Widget initialization."
      : triggerType === "unknown"
        ? "Unable to detect flow trigger type from exported flow config."
        : ""
  const resolvedError = configError || error
  const isReady = configError ? false : ready

  useEffect(() => {
    if (configError) {
      return
    }

    const isAsk = triggerType === "askTriggerNode"
    const rootId = isAsk ? "lamatic-ask-root" : "lamatic-chat-root"
    const scriptSrc = isAsk
      ? `https://widget.lamatic.ai/ask?projectId=${projectId}`
      : `https://widget.lamatic.ai/chat-v2?projectId=${projectId}`
    const scriptMarker = isAsk ? "ask" : "chat"
    const configPath = isAsk ? "askConfig" : "chatConfig"

    const controller = new AbortController()
    let script: HTMLScriptElement | null = null
    let cancelled = false
    let disposeScriptListeners = () => {}

    const init = async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (projectId) {
        headers["x-project-id"] = projectId
      }

      const configResponse = await fetch(`${apiUrl}/${configPath}?workflowId=${flowId}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      })

      if (!configResponse.ok) {
        throw new Error(
          `Lamatic ${configPath} returned ${configResponse.status}. Verify flow ID, deployment status, and trigger type.`,
        )
      }

      if (cancelled) {
        return
      }

      let root = document.getElementById(rootId) as HTMLDivElement | null
      if (!root) {
        root = document.createElement("div")
        root.id = rootId
        document.body.appendChild(root)
      }

      root.dataset.apiUrl = apiUrl
      root.dataset.flowId = flowId
      root.dataset.projectId = projectId

      script = document.querySelector(`script[data-lamatic-widget-kind="${scriptMarker}"]`) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement("script")
        script.type = "module"
        script.src = scriptSrc
        script.dataset.lamaticWidgetKind = scriptMarker
        document.body.appendChild(script)
      }

      const handleLoad = () => {
        script?.setAttribute("data-loaded", "true")
        if (!cancelled) {
          setReady(true)
          setError("")
        }
      }

      const handleError = () => {
        if (!cancelled) {
          setError("Failed to load Lamatic widget script.")
          setReady(false)
        }
      }

      script.addEventListener("load", handleLoad)
      script.addEventListener("error", handleError)

      if (script.getAttribute("data-loaded") === "true" && !cancelled) {
        setReady(true)
        setError("")
      }

      disposeScriptListeners = () => {
        script?.removeEventListener("load", handleLoad)
        script?.removeEventListener("error", handleError)
      }
    }

    init()
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return
        }
        if (!cancelled) {
          setReady(false)
          setError(err instanceof Error ? err.message : "Failed to initialize Lamatic widget.")
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      disposeScriptListeners()
    }
  }, [flowId, apiUrl, projectId, triggerType, configError])

  return (
    <Card className="p-8 bg-white/95 border-stone-200 shadow-xl space-y-4">
      <p className="text-sm text-muted-foreground">
        {triggerType === "askTriggerNode"
          ? "Ask trigger detected. Click the Ask button to open Lamatic Ask Widget."
          : triggerType === "chatTriggerNode"
            ? "Chat trigger detected. The Lamatic Chat Widget should appear automatically."
            : "Unable to detect the exported flow trigger type."}
      </p>

      {triggerType === "askTriggerNode" && (
        <button
          id="lamatic-ask-widget-button"
          type="button"
          aria-label="Ask a legal question"
          className="inline-flex h-12 items-center justify-center rounded-md bg-black px-6 text-sm font-medium text-white hover:bg-black/90"
        >
          Ask
        </button>
      )}

      {isReady ? (
        <p className="text-sm text-green-700">Lamatic Widget loaded successfully.</p>
      ) : (
        <p className="text-sm text-muted-foreground">Loading Lamatic Widget...</p>
      )}

      {resolvedError && <p className="text-sm text-red-700">{resolvedError}</p>}
    </Card>
  )
}
