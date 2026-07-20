'use server';

import { lamaticClient, flowId } from '../lib/lamatic-client';

export async function submitProject(
  githubUrl: string,
  builderName: string,
  contactEmail: string,
  hostedLink: string = ''
) {
  const response = await lamaticClient.executeFlow(flowId, {
    github_url: hostedLink ? `${githubUrl}|${hostedLink}` : githubUrl,
    builder_name: builderName,
    contact_email: contactEmail,
  });

  console.log('Lamatic response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic flow execution failed');
  }

  return response.result as {
    project_title: string;
    category: string;
    matched_sponsor: string;
    match_justification: string;
    breakout_table: string;
  };
}

const MOCK_UPVOTES: Record<string, number> = {
  '1': 42,
  '2': 28
};

export async function getSubmissions() {
  const getSubmissionsFlowId = process.env.LAMATIC_GET_SUBMISSIONS_FLOW_ID;
  if (!getSubmissionsFlowId) {
    console.warn('LAMATIC_GET_SUBMISSIONS_FLOW_ID is not defined, returning mock data.');
    return [
      {
        id: '1',
        project_title: 'PR Synthesizer (Mock)',
        category: 'Developer Tools',
        matched_sponsor: 'Google Cloud',
        breakout_table: 'Table A-12',
        tech_stack: 'Next.js, TypeScript, Lamatic.ai, Tailwind',
        description: 'An AI-powered PR review and synthesis tool that helps developers capture key changes and match against sponsors.',
        builder_name: 'Avadhut',
        contact_email: 'example1@gmail.com',
        github_url: 'https://github.com/Avad05/pr_synthesizer',
        hosted_link: 'https://demo.synthesizer.ai',
        upvotes: MOCK_UPVOTES['1']
      },
      {
        id: '2',
        project_title: 'SaaS Template Kit (Mock)',
        category: 'Boilerplate',
        matched_sponsor: 'Vercel',
        breakout_table: 'Table B-3',
        tech_stack: 'React, Next.js, PostgreSQL, Stripe',
        description: 'A production-ready SaaS template kit featuring authentication, billing, and highly optimized database tables.',
        builder_name: 'Avadhut',
        contact_email: 'example2@gmail.com',
        github_url: 'https://github.com/Avad05/saas_template',
        hosted_link: '',
        upvotes: MOCK_UPVOTES['2']
      }
    ];
  }

  const response = await lamaticClient.executeFlow(getSubmissionsFlowId, {});

  console.log('Lamatic getSubmissions response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic flow execution failed');
  }

  const result = response.result as { submissions?: any[] } | any[];
  const submissionsList = Array.isArray(result) ? result : (result?.submissions || []);

  return submissionsList.map((sub: any, idx: number) => {
    // Unpack githubUrl and hosted_link
    const githubParts = (sub.github_url || '').split('|');
    const githubUrl = githubParts[0] || '';
    const hostedLink = githubParts[1] || '';

    // Unpack breakout_table and upvotes
    const tableParts = (sub.breakout_table || '').split('|');
    const breakoutTable = tableParts[0] || 'N/A';
    
    let upvotes = 0;
    const upvotePart = tableParts.find((p: string) => p.startsWith('upvotes:'));
    if (upvotePart) {
      upvotes = parseInt(upvotePart.split(':')[1] || '0', 10) || 0;
    }

    return {
      id: sub.id?.toString() || idx.toString(),
      project_title: sub.project_title || 'Untitled Project',
      category: sub.category || 'General',
      matched_sponsor: sub.matched_sponsor || 'None',
      breakout_table: breakoutTable,
      tech_stack: sub.tech_stack || '',
      description: sub.description || '',
      builder_name: sub.builder_name || '',
      contact_email: sub.contact_email || '',
      github_url: githubUrl,
      hosted_link: hostedLink,
      upvotes: upvotes
    };
  });
}

export async function upvoteProject(id: string) {
  if (!id) throw new Error('Project ID is required');

  const upvoteFlowId = process.env.LAMATIC_UPVOTE_PROJECT_FLOW_ID;
  if (!upvoteFlowId) {
    console.warn('LAMATIC_UPVOTE_PROJECT_FLOW_ID is not defined, mock-incrementing upvote.');
    MOCK_UPVOTES[id] = (MOCK_UPVOTES[id] || 0) + 1;
    return { status: 'success', upvotes: MOCK_UPVOTES[id] };
  }

  const response = await lamaticClient.executeFlow(upvoteFlowId, { id });

  console.log('Lamatic upvoteProject response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic upvote execution failed');
  }

  return { status: 'success' };
}

let MOCK_SPONSORS = ['Google Cloud', 'Vercel', 'Supabase', 'Stitch', 'MongoDB'];

export async function getSponsors() {
  const getSponsorsFlowId = process.env.LAMATIC_GET_SPONSORS_FLOW_ID;
  if (!getSponsorsFlowId) {
    console.warn('LAMATIC_GET_SPONSORS_FLOW_ID is not defined, returning mock sponsors.');
    return MOCK_SPONSORS;
  }

  const response = await lamaticClient.executeFlow(getSponsorsFlowId, {});

  console.log('Lamatic getSponsors response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic flow execution failed');
  }

  const result = response.result as { sponsors?: any[] } | any[];
  const sponsorsList = Array.isArray(result) ? result : (result?.sponsors || []);

  return sponsorsList.map((s: any) => typeof s === 'string' ? s : s.name);
}

export async function addSponsor(name: string, description: string = '') {
  if (!name || name.trim() === '') {
    throw new Error('Sponsor name cannot be empty');
  }

  const addSponsorFlowId = process.env.LAMATIC_ADD_SPONSOR_FLOW_ID;
  if (!addSponsorFlowId) {
    console.warn('LAMATIC_ADD_SPONSOR_FLOW_ID is not defined, mock-adding sponsor.');
    if (!MOCK_SPONSORS.includes(name)) {
      MOCK_SPONSORS = [...MOCK_SPONSORS, name];
    }
    return { status: 'success' };
  }

  const response = await lamaticClient.executeFlow(addSponsorFlowId, { name, description });

  console.log('Lamatic addSponsor response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic flow execution failed');
  }

  return response.result as { status: string };
}

export async function deleteSubmission(id: string) {
  if (!id) throw new Error('Submission ID is required');

  const deleteFlowId = process.env.LAMATIC_DELETE_SUBMISSION_FLOW_ID;
  if (!deleteFlowId) {
    console.warn('LAMATIC_DELETE_SUBMISSION_FLOW_ID is not defined, mock-deleting submission.');
    return { status: 'success' };
  }

  const response = await lamaticClient.executeFlow(deleteFlowId, { id });

  console.log('Lamatic deleteSubmission response:', JSON.stringify(response, null, 2));

  if (response.status === 'error') {
    throw new Error(response.message || 'Lamatic delete execution failed');
  }

  return { status: 'success' };
}