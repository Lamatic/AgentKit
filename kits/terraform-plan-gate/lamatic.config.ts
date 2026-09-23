export default {
  name: "Terraform Plan Gate",
  description:
    "Risk-gates a Terraform plan before apply: extracts change facts from `terraform show -json` (never secrets), scores each resource change against organisation policy held in a Vector Store, and drafts the review comment with an allow / needs-approval / block verdict for a human to confirm.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Sarthak Bhardwaj",
    email: "sarthak.bhardwaj21b@iiitg.ac.in",
    url: "https://github.com/SarthakB11",
  },
  tags: ["terraform", "infrastructure", "devops", "security", "code-review", "rag"],
  steps: [
    {
      id: "tf-policy-ingest",
      type: "mandatory" as const,
      title: "Load the policy set",
      description:
        "Run once. Embeds the organisation's infrastructure policies into the `tfpolicies` Vector Store. Ten defaults ship in the flow; send your own set as `policies: [string]` (or `npm run policies -- policies.json`) to replace them.",
      envKey: "LAMATIC_TERRAFORM_POLICY_INGEST_FLOW_ID",
    },
    {
      id: "tf-plan-review",
      type: "mandatory" as const,
      envKey: "LAMATIC_TERRAFORM_PLAN_REVIEW_FLOW_ID",
      title: "Review a plan",
      description:
        "Takes JSON-encoded change facts, retrieves the matching policies, scores every change (low / medium / high / critical), writes the review comment, and computes the verdict.",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/terraform-plan-gate",
    deploy:
      "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fterraform-plan-gate%2Fapps&env=LAMATIC_TERRAFORM_PLAN_REVIEW_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20deployed%20plan-review%20flow%20ID.&envLink=https%3A%2F%2Flamatic.ai%2Fdocs",
    docs: "https://lamatic.ai/docs",
  },
};
