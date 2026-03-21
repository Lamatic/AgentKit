import { Lamatic } from 'lamatic'

export const lamaticClient = new Lamatic({
    endpoint:process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ENDPOINT as string,
    projectId: process.env.NEXT_PUBLIC_LAMATIC_PROJECT_ID as string,
    apiKey: process.env.NEXT_PUBLIC_LAMATIC_PROJECT_API_KEY as string,
  })
