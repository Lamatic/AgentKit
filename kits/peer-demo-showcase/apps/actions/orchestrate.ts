'use server';

import { lamaticClient, flowId } from '../lib/lamatic-client';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

async function sendConfirmationEmail({
  to,
  builderName,
  projectTitle,
  category,
  matchedSponsor,
  breakoutTable
}: {
  to: string;
  builderName: string;
  projectTitle: string;
  category: string;
  matchedSponsor: string;
  breakoutTable: string;
}) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #60a5fa; margin-top: 0;">Congratulations ${builderName}! 🚀</h2>
      <p style="color: #9ca3af; line-height: 1.6;">
        Your project <strong>"${projectTitle}"</strong> has been analyzed and matched by our AI agent pipeline!
      </p>
      <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <p style="margin: 4px 0;"><strong>📋 Category:</strong> ${category}</p>
        <p style="margin: 4px 0;"><strong>🎯 Recommended Track:</strong> <span style="color: #10b981;">${matchedSponsor}</span></p>
        <p style="margin: 4px 0;"><strong>📍 Breakout Session:</strong> ${breakoutTable}</p>
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Good luck with your submission!</p>
    </div>
  `;

  const subject = `🎉 Your Sponsor Track Assignment: ${matchedSponsor}`;

  // Option 1: Send via Resend if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@resend.dev',
        to,
        subject,
        html: htmlContent
      });

      if (res.error) {
        console.error('Resend email error:', res.error);
        if (res.error.message?.includes('only send testing emails to your own email address')) {
          const accountOwner = process.env.RESEND_ACCOUNT_EMAIL ? ` (${process.env.RESEND_ACCOUNT_EMAIL})` : '';
          console.warn(`[Resend Notice] Resend testing domain onboarding@resend.dev requires 'to' address to be the registered account owner email${accountOwner}. Verify a custom domain at resend.com/domains to send to any recipient.`);
        }
      } else {
        console.log(`Successfully dispatched Resend confirmation email to ${to}`);
        return;
      }
    } catch (err) {
      console.error('Failed to send Resend email:', err);
    }
  }

  // Option 2: Send via SMTP if SMTP credentials are configured
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Hackathon Showcase" <${user}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`Successfully dispatched SMTP confirmation email to ${to}`);
      return;
    } catch (err) {
      console.error('Failed to send SMTP email:', err);
    }
  }

  console.log('Neither RESEND_API_KEY nor SMTP credentials are set, skipping email dispatch.');
}

function inferTechStack(url: string = '', title: string = '', category: string = '', rawTechStack?: string): string {
  if (rawTechStack && rawTechStack.trim() !== '' && rawTechStack !== 'N/A' && rawTechStack !== 'None') {
    return rawTechStack.trim();
  }
  const text = (url + ' ' + title + ' ' + category).toLowerCase();

  if (text.includes('ai') || text.includes('gpt') || text.includes('llm') || text.includes('rag') || text.includes('python') || text.includes('fastapi') || text.includes('synthesizer') || category === 'AI/ML') {
    return 'Python, FastAPI, OpenAI, LangChain, PyTorch, Lamatic.ai';
  }
  if (text.includes('next') || text.includes('react') || text.includes('tailwind') || text.includes('typescript') || text.includes('cart') || text.includes('shop') || category === 'Developer Tools') {
    return 'React, Next.js, TypeScript, TailwindCSS, React Testing Library';
  }
  if (text.includes('sql') || text.includes('db') || text.includes('postgres') || text.includes('mongo') || text.includes('supabase') || category === 'Infrastructure') {
    return 'Node.js, PostgreSQL, Supabase, Redis, Docker';
  }
  if (text.includes('solidity') || text.includes('web3') || text.includes('dapp') || category === 'Web3 & Blockchain') {
    return 'Solidity, Hardhat, Ethers.js, React, TailwindCSS';
  }

  return 'TypeScript, React, Node.js, Next.js';
}

function validateSubmissionInputs(githubUrl: string, contactEmail: string, hostedLink: string = '') {
  if (!githubUrl || !githubUrl.startsWith('https://github.com/')) {
    throw new Error('Invalid GitHub URL: Must start with https://github.com/');
  }
  if (!contactEmail || !/\S+@\S+\.\S+/.test(contactEmail)) {
    throw new Error('Invalid contact email address');
  }
  if (hostedLink && hostedLink.trim() && !/^https?:\/\//.test(hostedLink.trim())) {
    throw new Error('Invalid hosted link: Must start with http:// or https://');
  }
}

export async function submitProject(
  githubUrl: string,
  builderName: string,
  contactEmail: string,
  hostedLink: string = ''
) {
  validateSubmissionInputs(githubUrl, contactEmail, hostedLink);

  // Deduplication check: check if this repository has already been submitted
  try {
    const existing = await getSubmissions();
    const cleanInputUrl = githubUrl.toLowerCase().trim().replace(/\/+$/, '').replace(/\.git$/, '');
    const isDuplicate = existing.some((sub: any) => {
      const cleanSubUrl = (sub.github_url || '').toLowerCase().trim().replace(/\/+$/, '').replace(/\.git$/, '');
      return cleanSubUrl && cleanInputUrl && cleanSubUrl === cleanInputUrl;
    });

    if (isDuplicate) {
      throw new Error('A project with this GitHub repository URL has already been submitted!');
    }
  } catch (err: any) {
    if (err.message.includes('already been submitted')) {
      throw err;
    }
  }

  let response: any;
  try {
    const activeSponsors = await getSponsors();
    const sponsorsStr = Array.isArray(activeSponsors) && activeSponsors.length > 0
      ? activeSponsors.join(', ')
      : 'Google Cloud, Vercel, Supabase, Stitch, MongoDB';

    response = await lamaticClient.executeFlow(flowId, {
      github_url: hostedLink ? `${githubUrl}|${hostedLink}` : githubUrl,
      builder_name: builderName,
      contact_email: contactEmail,
      sponsors_list: sponsorsStr,
    });
  } catch (err: any) {
    console.warn('Lamatic submitProject executeFlow failed (check LAMATIC_API_URL):', err.message);
  }

  let result = (response && response.status !== 'error' && response.result)
    ? (response.result as {
        project_title: string;
        category: string;
        matched_sponsor: string;
        match_justification: string;
        breakout_table: string;
        tech_stack?: string;
      })
    : {
        project_title: 'PR Synthesizer',
        category: 'Developer Tools',
        matched_sponsor: 'Google Cloud',
        match_justification: 'Your repository demonstrates advanced AI developer tooling and automated pipeline synthesis, matching Google Cloud\'s developer productivity track.',
        breakout_table: 'Table A-12',
        tech_stack: 'Next.js, TypeScript, Tailwind, Lamatic'
      };

  // Smart post-processing: If Lamatic returned "Other", "Sponsor information missing", or blank sponsor,
  // apply intelligent keyword matching from the repository URL/title to avoid generic "Other" matches
  if (!result.matched_sponsor || result.matched_sponsor === 'Other' || result.matched_sponsor.includes('missing') || result.matched_sponsor.includes('None')) {
    const urlLower = (githubUrl + ' ' + (result.project_title || '') + ' ' + (result.tech_stack || '')).toLowerCase();
    
    if (urlLower.includes('ai') || urlLower.includes('gpt') || urlLower.includes('llm') || urlLower.includes('rag') || urlLower.includes('agent') || urlLower.includes('python')) {
      result.matched_sponsor = 'AI Launchpad';
      result.category = 'AI/ML';
      result.breakout_table = 'Table A-01';
      result.match_justification = 'Matched with AI Launchpad based on AI/ML agent and language model architecture.';
    } else if (urlLower.includes('next') || urlLower.includes('react') || urlLower.includes('ui') || urlLower.includes('tailwind') || urlLower.includes('front')) {
      result.matched_sponsor = 'Modern Web Development & Developer Experience';
      result.category = 'Developer Tools';
      result.breakout_table = 'Table D-04';
      result.match_justification = 'Matched with Modern Web Development track based on Next.js/React frontend architecture.';
    } else if (urlLower.includes('sql') || urlLower.includes('db') || urlLower.includes('postgres') || urlLower.includes('mongo') || urlLower.includes('data')) {
      result.matched_sponsor = 'Supabase';
      result.category = 'Infrastructure';
      result.breakout_table = 'Table C-08';
      result.match_justification = 'Matched with Supabase based on database and backend data pipeline tooling.';
    } else {
      result.matched_sponsor = 'Google Cloud';
      result.category = 'Developer Tools';
      result.breakout_table = 'Table A-12';
    }
  }

  result.tech_stack = inferTechStack(githubUrl, result.project_title, result.category, result.tech_stack);

  // Trigger confirmation email asynchronously (via Resend or SMTP)
  sendConfirmationEmail({
    to: contactEmail,
    builderName,
    projectTitle: result.project_title,
    category: result.category,
    matchedSponsor: result.matched_sponsor,
    breakoutTable: result.breakout_table
  }).catch((err) => console.error('Confirmation email error:', err));

  return result;
}

/**
 * ARCHITECTURAL NOTICE: DEMO MOCK FALLBACK STORES
 * 
 * The MOCK_* mutable objects in this server module (MOCK_UPVOTES, MOCK_STATUSES, 
 * MOCK_SPONSORS, MOCK_SCORES, MOCK_JUDGES, MOCK_EVENT_CONFIG) serve as fallback 
 * in-memory data stores when Lamatic.ai flow environment variables are not present.
 * 
 * Ephemeral & Instance-Local Nature:
 * - These stores are instance-local and held in Node.js module memory on the current server process.
 * - Fallback-mode writes (upvotes, statuses, sponsors, judge accounts, scores, event config) 
 *   will reset upon redeployments, container restarts, or serverless cold starts.
 * - Concurrent serverless instances maintain isolated memory states and may diverge.
 * 
 * Production Deployment:
 * - Configure all active LAMATIC_*_FLOW_ID environment variables in .env.local to route all 
 *   queries and mutations directly to persistent Lamatic Cloud D1 database tables.
 */
const MOCK_UPVOTES: Record<string, number> = {};

export async function getSubmissions() {
  const getSubmissionsFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_GET_SUBMISSIONS_FLOW_ID;
  
  const mockSubmissions = [
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
      upvotes: MOCK_UPVOTES['1'],
      status: MOCK_STATUSES['1'] || 'shortlisted'
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
      upvotes: MOCK_UPVOTES['2'],
      status: MOCK_STATUSES['2'] || 'submitted'
    }
  ];

  if (!getSubmissionsFlowId) {
    console.warn('LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID is not defined, returning mock data.');
    return mockSubmissions;
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(getSubmissionsFlowId, {});
  } catch (err: any) {
    console.warn('Lamatic executeFlow failed (check LAMATIC_API_URL):', err.message);
    return mockSubmissions;
  }

  if (!response || response.status === 'error') {
    return mockSubmissions;
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
    
    // Read upvotes from sub.upvotes database column (or breakout_table fallback / mock fallback)
    let upvotes = typeof sub.upvotes === 'number' ? sub.upvotes : (parseInt(sub.upvotes || '0', 10) || 0);
    const upvotePart = tableParts.find((p: string) => p.startsWith('upvotes:'));
    if (upvotePart) {
      upvotes = parseInt(upvotePart.split(':')[1] || '0', 10) || upvotes;
    }
    if (MOCK_UPVOTES[sub.id?.toString()]) {
      upvotes = Math.max(upvotes, MOCK_UPVOTES[sub.id?.toString()]);
    }

    return {
      id: sub.id?.toString() || idx.toString(),
      project_title: sub.project_title || 'Untitled Project',
      category: sub.category || 'General',
      matched_sponsor: sub.matched_sponsor || 'None',
      breakout_table: breakoutTable,
      tech_stack: inferTechStack(githubUrl, sub.project_title, sub.category, sub.tech_stack),
      description: sub.description || '',
      builder_name: sub.builder_name || '',
      contact_email: sub.contact_email || '',
      github_url: githubUrl,
      hosted_link: hostedLink,
      upvotes: upvotes,
      status: sub.status || MOCK_STATUSES[sub.id?.toString() || idx.toString()] || 'submitted'
    };
  });
}

const MOCK_STATUSES: Record<string, string> = {
  '1': 'shortlisted',
  '2': 'submitted'
};

export async function updateProjectStatus(id: string, status: string) {
  if (!id) throw new Error('Submission ID is required');

  MOCK_STATUSES[id] = status;

  const flowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_STATUS_FLOW_ID;
  if (flowId) {
    try {
      await lamaticClient.executeFlow(flowId, { action: 'update_status', id, status });
    } catch (err: any) {
      console.warn('Lamatic updateProjectStatus executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

export async function updateProjectSponsor(id: string, matched_sponsor: string) {
  if (!id) throw new Error('Submission ID is required');

  const flowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_STATUS_FLOW_ID;
  if (flowId) {
    try {
      await lamaticClient.executeFlow(flowId, { action: 'update_sponsor', id, matched_sponsor });
    } catch (err: any) {
      console.warn('Lamatic updateProjectSponsor executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

export async function resubmitProject(
  id: string,
  githubUrl: string,
  builderName: string,
  contactEmail: string,
  hostedLink: string = ''
) {
  if (!id) throw new Error('Submission ID is required');

  // First run matching flow to get fresh AI results
  const newMatch = await submitProject(githubUrl, builderName, contactEmail, hostedLink);

  const updateFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_SUBMISSION_FLOW_ID;
  if (updateFlowId) {
    try {
      await lamaticClient.executeFlow(updateFlowId, {
        id,
        github_url: hostedLink ? `${githubUrl}|${hostedLink}` : githubUrl,
        project_title: newMatch.project_title,
        category: newMatch.category,
        matched_sponsor: newMatch.matched_sponsor,
        tech_stack: newMatch.tech_stack || '',
        description: newMatch.match_justification,
        breakout_table: newMatch.breakout_table
      });
    } catch (err: any) {
      console.warn('Lamatic resubmitProject executeFlow failed:', err.message);
    }
  }

  MOCK_STATUSES[id] = 'submitted';
  return newMatch;
}

export async function upvoteProject(id: string, currentCount: number = 0) {
  if (!id) throw new Error('Project ID is required');

  const newUpvotes = (MOCK_UPVOTES[id] || currentCount || 0) + 1;
  MOCK_UPVOTES[id] = newUpvotes;

  const upvoteFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPVOTE_PROJECT_FLOW_ID;
  if (upvoteFlowId) {
    try {
      await lamaticClient.executeFlow(upvoteFlowId, { action: 'upvote', id, upvotes: newUpvotes });
    } catch (err: any) {
      console.warn('Lamatic upvoteProject executeFlow failed:', err.message);
    }
  }

  return { status: 'success', upvotes: newUpvotes };
}

let MOCK_SPONSORS = ['Google Cloud', 'Vercel', 'Supabase', 'Stitch', 'MongoDB'];

export async function getSponsors() {
  const getSponsorsFlowId = process.env.LAMATIC_SPONSORS_MANAGER_FLOW_ID || process.env.LAMATIC_GET_SPONSORS_FLOW_ID;
  if (!getSponsorsFlowId) {
    console.warn('LAMATIC_SPONSORS_MANAGER_FLOW_ID is not defined, returning mock sponsors.');
    return MOCK_SPONSORS;
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(getSponsorsFlowId, { action: 'list' });
  } catch (err: any) {
    console.warn('Lamatic getSponsors executeFlow failed:', err.message);
    return MOCK_SPONSORS;
  }

  if (!response || response.status === 'error') {
    return MOCK_SPONSORS;
  }

  const result = response.result as { sponsors?: any[] } | any[];
  const sponsorsList = Array.isArray(result) ? result : (result?.sponsors || []);

  return sponsorsList.map((s: any) => typeof s === 'string' ? s : s.name);
}

export async function addSponsor(name: string, description: string = '') {
  if (!name || name.trim() === '') {
    throw new Error('Sponsor name cannot be empty');
  }

  if (!MOCK_SPONSORS.includes(name)) {
    MOCK_SPONSORS = [...MOCK_SPONSORS, name];
  }

  const addSponsorFlowId = process.env.LAMATIC_SPONSORS_MANAGER_FLOW_ID || process.env.LAMATIC_ADD_SPONSOR_FLOW_ID;
  if (addSponsorFlowId) {
    try {
      await lamaticClient.executeFlow(addSponsorFlowId, { action: 'add', name, description });
    } catch (err: any) {
      console.warn('Lamatic addSponsor executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

export async function deleteSubmission(id: string) {
  if (!id) throw new Error('Submission ID is required');

  const deleteFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_DELETE_SUBMISSION_FLOW_ID;
  if (deleteFlowId) {
    try {
      await lamaticClient.executeFlow(deleteFlowId, { action: 'delete', id });
    } catch (err: any) {
      console.warn('Lamatic deleteSubmission executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

// -- Judge Management & Scoring Actions --

export interface JudgeScore {
  id: string;
  project_id: string;
  judge_name: string;
  innovation: number;
  execution: number;
  impact: number;
  presentation: number;
  notes: string;
  created_at: string;
}

let MOCK_SCORES: JudgeScore[] = [
  {
    id: '101',
    project_id: '1',
    judge_name: 'Judge Sarah',
    innovation: 9,
    execution: 8,
    impact: 9,
    presentation: 10,
    notes: 'Exceptional PR review pipeline architecture!',
    created_at: new Date().toISOString()
  }
];

let MOCK_JUDGES: Array<{ id: string; name: string; email: string; password?: string }> = [
  { id: 'j1', name: 'Judge Sarah', email: 'sarah@judge.com' },
  { id: 'j2', name: 'Judge Alex', email: 'alex@judge.com' }
];

export async function verifyJudgeCredentials(password: string, name?: string): Promise<{ valid: boolean; judgeName: string }> {
  const configuredPassword = process.env.JUDGE_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return { valid: false, judgeName: '' };
  }

  const judges = await manageJudges('list');
  const list = Array.isArray(judges) ? judges : [];

  const matchedJudge = list.find((j: any) => {
    if (name && name.trim()) {
      return j.name && j.name.toLowerCase().trim() === name.toLowerCase().trim();
    }
    return true;
  });

  const isPasswordValid = password === configuredPassword || list.some((j: any) => j.password && j.password === password);

  if (isPasswordValid && (matchedJudge || !name || !name.trim())) {
    return {
      valid: true,
      judgeName: (name && name.trim()) || matchedJudge?.name || 'Judge'
    };
  }

  return { valid: false, judgeName: '' };
}

export async function submitScore(
  projectId: string,
  judgeName: string,
  innovation: number,
  execution: number,
  impact: number,
  presentation: number,
  notes: string = ''
) {
  if (!projectId || !judgeName) throw new Error('Project ID and Judge Name are required');

  const newScore: JudgeScore = {
    id: Date.now().toString(),
    project_id: projectId,
    judge_name: judgeName,
    innovation,
    execution,
    impact,
    presentation,
    notes,
    created_at: new Date().toISOString()
  };

  MOCK_SCORES.unshift(newScore);

  const flowId = process.env.LAMATIC_JUDGING_MANAGER_FLOW_ID || process.env.LAMATIC_SUBMIT_SCORE_FLOW_ID;
  if (!flowId) {
    console.warn('LAMATIC_JUDGING_MANAGER_FLOW_ID is not defined, mock-storing score.');
    return { status: 'success', score: newScore };
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(flowId, {
      action: 'submit_score',
      project_id: projectId,
      judge_name: judgeName,
      innovation,
      execution,
      impact,
      presentation,
      notes
    });
  } catch (err: any) {
    console.warn('Lamatic submitScore executeFlow failed:', err.message);
  }

  if (response && response.status === 'error') {
    throw new Error(response.message || 'Failed to submit score');
  }

  return { status: 'success', score: newScore };
}

export async function getScores() {
  const flowId = process.env.LAMATIC_JUDGING_MANAGER_FLOW_ID || process.env.LAMATIC_GET_SCORES_FLOW_ID;
  if (!flowId) {
    console.warn('LAMATIC_JUDGING_MANAGER_FLOW_ID is not defined, returning mock scores.');
    return MOCK_SCORES;
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(flowId, { action: 'get_scores' });
  } catch (err: any) {
    console.warn('Lamatic getScores executeFlow failed:', err.message);
    return MOCK_SCORES;
  }

  if (!response || response.status === 'error') {
    return MOCK_SCORES;
  }

  const result = response.result as { scores?: any[] } | any[];
  const list = Array.isArray(result) ? result : (result?.scores || []);
  return list.length > 0 ? list : MOCK_SCORES;
}

export async function manageJudges(
  action: 'add' | 'list' | 'remove',
  judgeData?: { id?: string; name?: string; email?: string; password?: string }
) {
  if (action === 'list') {
    const flowId = process.env.LAMATIC_JUDGING_MANAGER_FLOW_ID || process.env.LAMATIC_MANAGE_JUDGES_FLOW_ID;
    if (!flowId) return MOCK_JUDGES;
    
    let response: any;
    try {
      response = await lamaticClient.executeFlow(flowId, { action: 'list_judges' });
    } catch (err: any) {
      console.warn('Lamatic manageJudges list executeFlow failed:', err.message);
      return MOCK_JUDGES;
    }

    if (!response || response.status === 'error') return MOCK_JUDGES;

    const result = response.result as { judges?: any[] } | any[];
    return Array.isArray(result) ? result : (result?.judges || MOCK_JUDGES);
  }

  if (action === 'add' && judgeData) {
    if (!judgeData.name || !judgeData.password) throw new Error('Name and password are required for judge creation');
    const newJudge = {
      id: Date.now().toString(),
      name: judgeData.name,
      email: judgeData.email || `${judgeData.name.toLowerCase().replace(/\s+/g, '')}@judge.com`,
      password: judgeData.password
    };
    MOCK_JUDGES.push(newJudge);

    const flowId = process.env.LAMATIC_JUDGING_MANAGER_FLOW_ID || process.env.LAMATIC_MANAGE_JUDGES_FLOW_ID;
    if (flowId) {
      try {
        await lamaticClient.executeFlow(flowId, { action: 'add_judge', ...newJudge });
      } catch (err: any) {
        console.warn('Lamatic add_judge executeFlow failed:', err.message);
      }
    }
    return { status: 'success', judge: newJudge };
  }

  if (action === 'remove' && judgeData?.id) {
    MOCK_JUDGES = MOCK_JUDGES.filter(j => j.id !== judgeData.id);
    return { status: 'success' };
  }

  return { status: 'success' };
}

// -- Event Configuration Actions (Deadline settings) --

let MOCK_EVENT_CONFIG: Record<string, string> = {
  submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // default: 7 days from now
};

export async function getEventConfig() {
  const flowId = process.env.LAMATIC_EVENT_CONFIG_FLOW_ID || process.env.LAMATIC_GET_EVENT_CONFIG_FLOW_ID;
  if (!flowId) {
    return MOCK_EVENT_CONFIG;
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(flowId, { action: 'get_config' });
  } catch (err: any) {
    console.warn('Lamatic getEventConfig executeFlow failed:', err.message);
    return MOCK_EVENT_CONFIG;
  }

  if (!response || response.status === 'error') {
    return MOCK_EVENT_CONFIG;
  }
  const result = response.result as { config?: any[] } | any[];
  const configList = Array.isArray(result) ? result : (result?.config || []);
  const map: Record<string, string> = { ...MOCK_EVENT_CONFIG };
  configList.forEach((item: any) => {
    if (item.key && item.value) map[item.key] = item.value;
  });
  return map;
}

export async function setEventConfig(key: string, value: string) {
  if (!key) throw new Error('Config key is required');

  MOCK_EVENT_CONFIG[key] = value;

  const flowId = process.env.LAMATIC_EVENT_CONFIG_FLOW_ID || process.env.LAMATIC_SET_EVENT_CONFIG_FLOW_ID;
  if (!flowId) {
    return { status: 'success' };
  }

  let response: any;
  try {
    response = await lamaticClient.executeFlow(flowId, { action: 'set_config', key, value });
  } catch (err: any) {
    console.warn('Lamatic setEventConfig executeFlow failed:', err.message);
  }

  if (response && response.status === 'error') {
    throw new Error(response.message || 'Failed to update config');
  }

  return { status: 'success' };
}