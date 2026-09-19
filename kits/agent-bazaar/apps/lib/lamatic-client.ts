import { Lamatic } from "lamatic";

export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  endpoint: process.env.LAMATIC_API_URL!,
});
