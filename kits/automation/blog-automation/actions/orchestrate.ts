"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate"

export type BlogAutomationResult = {
  success: boolean
  draft?: string
  optimizedContent?: string
  url?: string
  error?: string
}

export async function runBlogAutomation(
  topic: string,
  keywords: string,
  instructions: string
): Promise<BlogAutomationResult> {
  try {
    const { flows } = config

    // MOCK MODE: For testing without live Lamatic keys
    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true" || !process.env.LAMATIC_API_KEY) {
      console.log("[Blog Automation] Running in MOCK MODE")
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network lag
      return {
        success: true,
        draft: "This is a mock draft for: " + topic,
        optimizedContent: "# " + topic + "\n\nThis is optimized content with keywords: " + keywords + "\n\nGenerated with Blog Automation Kit.",
        url: "https://example.com/mock-blog-post"
      }
    }

    // 1. Drafting Phase
    console.log("[Blog Automation] Starting Drafting...")
    const draftingFlow = flows.drafting
    if (!draftingFlow.workflowId) throw new Error("Drafting Flow ID missing")

    const payload = {
      topic,
      keywords,
      instructions,
      // Common variations to ensure mapping
      Topic: topic,
      Keywords: keywords,
      Instructions: instructions
    }
    console.log("[Blog Automation] Sending Payload to Drafting:", JSON.stringify(payload, null, 2))

    const draftingRes = await lamaticClient.executeFlow(draftingFlow.workflowId, payload)
    console.log("[Blog Automation] Drafting Response:", JSON.stringify(draftingRes, null, 2))

    if (draftingRes?.status === "error") {
      throw new Error(`Lamatic Error: ${draftingRes.message || "Unknown error"}`)
    }

    const draft = draftingRes?.result?.generatedResponse || draftingRes?.result?.content || draftingRes?.result?.draft
    if (!draft) throw new Error("Drafting failed: No content generated")

    // 2. SEO Optimization Phase
    const seoFlow = flows.seo
    if (!seoFlow.workflowId) throw new Error("SEO Flow ID missing")

    const seoPayload = {
      draft,
      keywords,
      // Common variations to ensure mapping
      content: draft,
      text: draft,
      Keywords: keywords
    }
    console.log("[Blog Automation] Sending Payload to SEO:", JSON.stringify(seoPayload, null, 2))

    const seoRes = await lamaticClient.executeFlow(seoFlow.workflowId, seoPayload)
    console.log("[Blog Automation] SEO Response:", JSON.stringify(seoRes, null, 2))

    if (seoRes?.status === "error") {
      throw new Error(`Lamatic SEO Error: ${seoRes.message || "Unknown error"}`)
    }
    const optimizedContent = seoRes?.result?.generatedResponse || seoRes?.result?.optimized_content || seoRes?.result?.content || seoRes?.result?.text
    if (!optimizedContent) throw new Error("SEO Optimization failed")

    // 3. Publishing Phase
    console.log("[Blog Automation] Starting Publishing...")
    const publishFlow = flows.publish
    if (!publishFlow.workflowId) throw new Error("Publish Flow ID missing")

    const publishPayload = {
      content: optimizedContent,
      title: topic,
      // Common variations to ensure mapping
      text: optimizedContent,
      Topic: topic,
      Title: topic
    }
    console.log("[Blog Automation] Sending Payload to Publish:", JSON.stringify(publishPayload, null, 2))

    const publishRes = await lamaticClient.executeFlow(publishFlow.workflowId, publishPayload)
    console.log("[Blog Automation] Publish Response:", JSON.stringify(publishRes, null, 2))

    if (publishRes?.status === "error") {
      throw new Error(`Lamatic Publish Error: ${publishRes.message || "Unknown error"}`)
    }

    const url = publishRes?.result?.url || publishRes?.result?.post_url || publishRes?.result?.link || ""
    const rawStatus = publishRes?.result?.publish_status || publishRes?.result?.status || publishRes?.status
    const status = (rawStatus === "success" || rawStatus === "publish") ? "success" : rawStatus
    const message = publishRes?.result?.message || ""

    // Detect if the response is an HTML error page (common with WordPress 404s)
    if (typeof message === "string" && (message.includes("<!DOCTYPE html>") || message.includes("Page not found"))) {
      throw new Error("Publishing failed: The CMS returned a 'Page Not Found' (404) error. Please check your CMS endpoint in Lamatic Studio.")
    }

    if (status !== "success" && !url) {
      throw new Error(`Publishing failed: Response status was '${rawStatus}' and no URL was found.`)
    }

    return {
      success: true,
      draft,
      optimizedContent,
      url: typeof url === "string" ? url : ""
    }

  } catch (error) {
    console.error("[Blog Automation] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    }
  }
}
