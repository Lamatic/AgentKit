export default {
  name: "Blog Writing Automation",
  description: "Automate blog post generation and publishing via webhooks or schedules. Includes SEO optimization and CMS integration steps.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["automation","content","webhook"],
  steps: [
    {
        "id": "blog-drafting",
        "type": "mandatory",
        "envKey": "AUTOMATION_BLOG_DRAFTING"
    },
    {
        "id": "blog-seo",
        "type": "mandatory",
        "envKey": "AUTOMATION_BLOG_SEO"
    },
    {
        "id": "blog-publish",
        "type": "mandatory",
        "envKey": "AUTOMATION_BLOG_PUBLISH"
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/blog-automation",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fblog-automation%2Fapps&env=AUTOMATION_BLOG_DRAFTING,AUTOMATION_BLOG_SEO,AUTOMATION_BLOG_PUBLISH,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
    "docs": "https://lamatic.ai/templates/agentkits/automation/blog-automation"
},
};
