"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

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

    const draftingRes = await lamaticClient.executeFlow(draftingFlow.workflowId, {
      topic,
      keywords,
      instructions
    })
    const draft = draftingRes?.result?.draft
    if (!draft) throw new Error("Drafting failed: No content generated")

    // 2. SEO Optimization Phase
    console.log("[Blog Automation] Starting SEO Optimization...")
    const seoFlow = flows.seo
    if (!seoFlow.workflowId) throw new Error("SEO Flow ID missing")

    const seoRes = await lamaticClient.executeFlow(seoFlow.workflowId, {
      draft,
      keywords
    })
    const optimizedContent = seoRes?.result?.optimized_content
    if (!optimizedContent) throw new Error("SEO Optimization failed")

    // 3. Publishing Phase
    console.log("[Blog Automation] Starting Publishing...")
    const publishFlow = flows.publish
    if (!publishFlow.workflowId) throw new Error("Publish Flow ID missing")

    const publishRes = await lamaticClient.executeFlow(publishFlow.workflowId, {
      content: optimizedContent,
      title: topic // Using topic as title for now
    })

    const url = publishRes?.result?.url
    const status = publishRes?.result?.publish_status

    if (status !== "success" && !url) {
      throw new Error("Publishing failed")
    }

    return {
      success: true,
      draft,
      optimizedContent,
      url
    }

  } catch (error) {
    console.error("[Blog Automation] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    }
  }
}
