'use server';

import { lamatiConfig } from '../lib/lamatic-client';

export async function submitProject(
  githubUrl: string,
  builderName: string,
  contactEmail: string
) {
  // Convert repo URL to README URL
  const readmeUrl = githubUrl.replace(
    'https://github.com/',
    'https://github.com/'
  ) + '/blob/main/README.md';

  const response = await fetch(`${lamatiConfig.apiUrl}/api/flow/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lamatiConfig.apiKey}`,
    },
    body: JSON.stringify({
      projectId: lamatiConfig.projectId,
      flowId: lamatiConfig.flowId,
      data: {
        github_url: readmeUrl,
        builder_name: builderName,
        contact_email: contactEmail,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Lamatic error: ${err}`);
  }

  return response.json();
}