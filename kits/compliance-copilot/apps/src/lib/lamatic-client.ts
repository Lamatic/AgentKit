import { Lamatic } from "lamatic";

const client = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY as string,
  projectId: process.env.LAMATIC_PROJECT_ID as string,
  endpoint: process.env.LAMATIC_API_URL as string,
});

export { client };
