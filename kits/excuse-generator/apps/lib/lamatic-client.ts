import { Lamatic } from "lamatic";

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
    throw new Error(
        "All API Credentials in environment variable are not set. Please add it to your .env.local file."
    );
}
export const lamaticClient = new Lamatic({
    endpoint: process.env.LAMATIC_API_URL as string,
    projectId: process.env.LAMATIC_PROJECT_ID as string,
    apiKey: process.env.LAMATIC_API_KEY as string
});
