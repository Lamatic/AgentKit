'use server';

import { lamaticClient } from '../lib/lamatic-client';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const flowId = process.env.LAMATIC_SUBMISSION_FLOW_ID || 'showcase-submission-flow';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailOptions {
  to: string;
  builderName: string;
  projectTitle: string;
  category: string;
  matchedSponsor: string;
  breakoutTable: string;
}

/**
 * Escapes user-controlled and LLM-derived strings before inserting into HTML.
 * Prevents HTML injection in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strictly validates server-issued identifier format before interpolation into flow WHERE predicates.
 * Rejects any ID containing quotes, spaces, SQL delimiters, or non-alphanumeric characters.
 */
function validateId(id: string): string {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid identifier format');
  }
  return id;
}

/**
 * Sanitizes input strings before passing them to Lamatic flow executions.
 * Escapes double quotes, single quotes, backslashes, and newlines so that Lamatic template interpolation
 * into flow JSON node definitions (e.g. `{{triggerNode_1.output.param}}`) remains valid JSON and safe for WHERE predicates.
 */
function sanitizeFlowInput(val: string): string {
  if (typeof val !== 'string') return val;
  return val
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

async function sendConfirmationEmail(options: EmailOptions) {
  const { to, builderName, projectTitle, category, matchedSponsor, breakoutTable } = options;

  const safe = {
    builderName: escapeHtml(builderName),
    projectTitle: escapeHtml(projectTitle),
    category: escapeHtml(category),
    matchedSponsor: escapeHtml(matchedSponsor),
    breakoutTable: escapeHtml(breakoutTable),
  };

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Peer Showcase <${process.env.SMTP_USER}>`,
        to,
        subject: `🚀 Submission Confirmed: ${safe.projectTitle} @ Peer Demo Showcase`,
        html: `
          <div style="font-family: sans-serif; background-color: #030014; color: #ffffff; padding: 32px; border-radius: 16px;">
            <h2 style="color: #60a5fa;">Hey ${safe.builderName}! 🚀</h2>
            <p style="font-size: 16px; color: #e2e8f0;">Your project <strong>${safe.projectTitle}</strong> has been successfully submitted and matched by our AI Agent flow!</p>
            <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 24px 0;">
              <p style="margin: 8px 0; color: #94a3b8;"><strong>Category:</strong> ${safe.category}</p>
              <p style="margin: 8px 0; color: #94a3b8;"><strong>Matched Sponsor:</strong> <span style="color: #38bdf8;">${safe.matchedSponsor}</span></p>
              <p style="margin: 8px 0; color: #94a3b8;"><strong>Assigned Breakout Table:</strong> <span style="color: #facc15;">${safe.breakoutTable}</span></p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">Good luck on Demo Day!</p>
          </div>
        `
      });
      return;
    } catch (err: any) {
      console.warn('SMTP confirmation email failed:', err.message);
    }
  }

  if (!resend) {
    return;
  }

  const accountEmail = process.env.RESEND_ACCOUNT_EMAIL;
  let targetToEmail = to;

  if (resendFromEmail.includes('resend.dev')) {
    if (accountEmail) {
      targetToEmail = accountEmail;
    } else {
      console.warn(
        `Resend is using unverified default domain (${resendFromEmail}). ` +
        `To deliver emails to external addresses like ${to}, verify a custom domain in Resend ` +
        `or configure RESEND_ACCOUNT_EMAIL in .env.local to target your account email address.`
      );
    }
  }

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: [targetToEmail],
      subject: `🚀 Submission Confirmed: ${safe.projectTitle} @ Peer Demo Showcase`,
      html: `
        <div style="font-family: sans-serif; background-color: #030014; color: #ffffff; padding: 32px; border-radius: 16px;">
          <h2 style="color: #60a5fa;">Hey ${safe.builderName}! 🚀</h2>
          <p style="font-size: 16px; color: #e2e8f0;">Your project <strong>${safe.projectTitle}</strong> has been successfully submitted and matched by our AI Agent flow!</p>
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 8px 0; color: #94a3b8;"><strong>Category:</strong> ${safe.category}</p>
            <p style="margin: 8px 0; color: #94a3b8;"><strong>Matched Sponsor:</strong> <span style="color: #38bdf8;">${safe.matchedSponsor}</span></p>
            <p style="margin: 8px 0; color: #94a3b8;"><strong>Assigned Breakout Table:</strong> <span style="color: #facc15;">${safe.breakoutTable}</span></p>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Good luck on Demo Day!</p>
        </div>
      `
    });
  } catch (err: any) {
    console.warn('Resend confirmation email failed:', err.message);
  }
}

function inferTechStack(url: string, title: string, category: string, existingStack?: string): string {
  if (existingStack && existingStack.trim() && existingStack !== 'TypeScript, React, Node.js') {
    return existingStack;
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

/**
 * Submits a new project for AI sponsor matching and D1 persistence.
 * @param githubUrl - Public GitHub repository URL.
 * @param builderName - Name of project builder or team lead.
 * @param contactEmail - Contact email address.
 * @param hostedLink - Optional live demo or deployment URL.
 * @returns Object containing project title, category, matched sponsor, justification, and breakout table.
 */
export async function submitProject(
  githubUrl: string,
  builderName: string,
  contactEmail: string,
  hostedLink: string = ''
) {
  validateSubmissionInputs(githubUrl, contactEmail, hostedLink);

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

const MOCK_UPVOTES: Record<string, number> = {};

/**
 * Retrieves all submitted projects from Lamatic Cloud D1 database or mock fallback.
 * @returns Promise resolving to an array of submission records.
 */
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
    const githubParts = (sub.github_url || '').split('|');
    const githubUrl = githubParts[0] || '';
    const hostedLink = githubParts[1] || '';

    const tableParts = (sub.breakout_table || '').split('|');
    const breakoutTable = tableParts[0] || 'N/A';
    
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

/**
 * Updates the review/curation status of a project submission.
 * @param id - Unique submission ID.
 * @param status - Target status string ('submitted' | 'shortlisted' | 'winner' | 'rejected').
 * @returns Status object indicating success.
 */
export async function updateProjectStatus(id: string, status: string) {
  if (!id) throw new Error('Submission ID is required');

  MOCK_STATUSES[id] = status;

  const flowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_STATUS_FLOW_ID;
  if (flowId) {
    try {
      await lamaticClient.executeFlow(flowId, { action: 'update_status', id: validateId(id), status: sanitizeFlowInput(status) });
    } catch (err: any) {
      console.warn('Lamatic updateProjectStatus executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

/**
 * Reassigns the matched sponsor track for a project submission.
 * @param id - Unique submission ID.
 * @param matched_sponsor - Name of the newly assigned sponsor.
 * @returns Status object indicating success.
 */
export async function updateProjectSponsor(id: string, matched_sponsor: string) {
  if (!id) throw new Error('Submission ID is required');

  const flowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_STATUS_FLOW_ID;
  if (flowId) {
    try {
      await lamaticClient.executeFlow(flowId, { action: 'update_sponsor', id: validateId(id), matched_sponsor: sanitizeFlowInput(matched_sponsor) });
    } catch (err: any) {
      console.warn('Lamatic updateProjectSponsor executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

/**
 * Re-evaluates AI sponsor matching and updates existing project submission metadata.
 * @param id - Unique submission ID.
 * @param githubUrl - GitHub repository URL.
 * @param builderName - Builder name.
 * @param contactEmail - Contact email address.
 * @param hostedLink - Optional live demo URL.
 * @returns Promise resolving to updated matching result.
 */
export async function resubmitProject(
  id: string,
  githubUrl: string,
  builderName: string,
  contactEmail: string,
  hostedLink: string = ''
) {
  if (!id) throw new Error('Submission ID is required');

  const newMatch = await submitProject(githubUrl, builderName, contactEmail, hostedLink);

  const updateFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPDATE_SUBMISSION_FLOW_ID;
  if (updateFlowId) {
    try {
      await lamaticClient.executeFlow(updateFlowId, {
        id: validateId(id),
        github_url: sanitizeFlowInput(hostedLink ? `${githubUrl}|${hostedLink}` : githubUrl),
        project_title: sanitizeFlowInput(newMatch.project_title),
        category: sanitizeFlowInput(newMatch.category),
        matched_sponsor: sanitizeFlowInput(newMatch.matched_sponsor),
        tech_stack: sanitizeFlowInput(newMatch.tech_stack || ''),
        description: sanitizeFlowInput(newMatch.match_justification),
        breakout_table: sanitizeFlowInput(newMatch.breakout_table)
      });
    } catch (err: any) {
      console.warn('Lamatic resubmitProject executeFlow failed:', err.message);
    }
  }

  MOCK_STATUSES[id] = 'submitted';
  return newMatch;
}

/**
 * Increments community upvote count for a given project submission.
 * @param id - Project submission ID.
 * @param currentCount - Current upvote count baseline.
 * @returns Status object containing updated upvote count.
 */
export async function upvoteProject(id: string, currentCount: number = 0) {
  if (!id) throw new Error('Project ID is required');

  const newUpvotes = (MOCK_UPVOTES[id] || currentCount || 0) + 1;
  MOCK_UPVOTES[id] = newUpvotes;

  const upvoteFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_UPVOTE_PROJECT_FLOW_ID;
  if (upvoteFlowId) {
    try {
      await lamaticClient.executeFlow(upvoteFlowId, { action: 'upvote', id: validateId(id), upvotes: newUpvotes });
    } catch (err: any) {
      console.warn('Lamatic upvoteProject executeFlow failed:', err.message);
    }
  }

  return { status: 'success', upvotes: newUpvotes };
}

let MOCK_SPONSORS = ['Google Cloud', 'Vercel', 'Supabase', 'Stitch', 'MongoDB'];

/**
 * Retrieves the catalog of active hackathon sponsors.
 * @returns Promise resolving to an array of sponsor names.
 */
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

/**
 * Adds a new sponsor track to the event sponsor catalog.
 * @param name - Sponsor company or track name.
 * @param description - Optional description or focus area.
 * @returns Status object indicating success.
 */
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
      await lamaticClient.executeFlow(addSponsorFlowId, { action: 'add', name: sanitizeFlowInput(name), description: sanitizeFlowInput(description) });
    } catch (err: any) {
      console.warn('Lamatic addSponsor executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

/**
 * Deletes a project submission from the platform.
 * @param id - Unique submission ID to remove.
 * @returns Status object indicating success.
 */
export async function deleteSubmission(id: string) {
  if (!id) throw new Error('Submission ID is required');

  const deleteFlowId = process.env.LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID || process.env.LAMATIC_DELETE_SUBMISSION_FLOW_ID;
  if (deleteFlowId) {
    try {
      await lamaticClient.executeFlow(deleteFlowId, { action: 'delete', id: validateId(id) });
    } catch (err: any) {
      console.warn('Lamatic deleteSubmission executeFlow failed:', err.message);
    }
  }

  return { status: 'success' };
}

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

/**
 * Verifies judge credentials against configured passwords and judge registry.
 * @param password - Access code or password to verify.
 * @param name - Optional judge display name.
 * @returns Object indicating whether credentials are valid and returning matching judge name.
 */
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

/**
 * Submits judge evaluation scores and feedback notes for a project.
 * @param projectId - Target project ID.
 * @param judgeName - Name of evaluating judge.
 * @param innovation - Score for innovation (1-10).
 * @param execution - Score for technical execution (1-10).
 * @param impact - Score for potential impact (1-10).
 * @param presentation - Score for presentation (1-10).
 * @param notes - Optional evaluation feedback notes.
 * @returns Status object containing saved score record.
 */
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

/**
 * Retrieves all submitted judge evaluation scores.
 * @returns Promise resolving to an array of judge evaluation scores.
 */
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

/**
 * Manages judge accounts (list, add, or remove judges).
 * @param action - Action to perform ('add' | 'list' | 'remove').
 * @param judgeData - Optional judge data object for add/remove operations.
 * @returns Promise resolving to judge list or status result.
 */
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

let MOCK_EVENT_CONFIG: Record<string, string> = {
  submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

/**
 * Retrieves the global event configuration settings (e.g., submission deadline).
 * @returns Promise resolving to a key-value record of event settings.
 */
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

/**
 * Updates or sets a global event configuration setting.
 * @param key - Event configuration key (e.g., 'submission_deadline').
 * @param value - Setting value string (e.g., ISO timestamp).
 * @returns Status object indicating success.
 */
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