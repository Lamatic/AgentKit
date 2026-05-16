import { Lamatic } from "lamatic";

const lamaticClient = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY || "",
  endpoint: process.env.LAMATIC_API_URL || "",
  projectId: process.env.LAMATIC_PROJECT_ID || "",
});

export default lamaticClient;
