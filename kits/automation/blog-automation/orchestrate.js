export const config = {
    "type": "sequential",
    "flows": {
      "drafting": {
          "name": "Content Drafting",
          "type": "graphQL",
          "workflowId": process.env.AUTOMATION_BLOG_DRAFTING,
          "description": "Generates a blog post draft from the trigger payload (topic, keywords).",
          "expectedOutput": ["draft"],
          "inputSchema": {
              "topic": "string",
              "keywords": "string",
              "instructions": "string"
          },
          "outputSchema": {
              "draft": "string"
          },
          "mode": "sync",
          "polling": "false"
      },
      "seo": {
          "name": "SEO Optimization",
          "type": "graphQL",
          "workflowId": process.env.AUTOMATION_BLOG_SEO,
          "description": "Refines the draft for SEO and coherence.",
          "dependsOn": ["drafting"],
          "expectedOutput": ["optimized_content"],
          "inputSchema": {
              "draft": "string",
              "keywords": "string"
          },
          "outputSchema": {
              "optimized_content": "string"
          },
          "mode": "sync",
          "polling": "false"
      },
      "publish": {
          "name": "CMS Publishing",
          "type": "graphQL",
          "workflowId": process.env.AUTOMATION_BLOG_PUBLISH,
          "description": "Publishes the optimized content to the target CMS.",
          "dependsOn": ["seo"],
          "expectedOutput": ["publish_status", "url"],
          "inputSchema": {
              "content": "string",
              "title": "string"
          },
          "outputSchema": {
              "publish_status": "string",
              "url": "string"
          },
          "mode": "sync",
          "polling": "false"
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey": process.env.LAMATIC_API_KEY
    }
}
