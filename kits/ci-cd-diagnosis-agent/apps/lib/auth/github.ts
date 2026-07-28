import crypto from "crypto";

export interface GitHubUserProfile {
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export function getGitHubClientId(): string {
  return process.env.GITHUB_CLIENT_ID || "";
}

export function getGitHubClientSecret(): string {
  return process.env.GITHUB_CLIENT_SECRET || "";
}

/**
 * Generate a random cryptographically secure CSRF state token
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate GitHub OAuth Authorization URL
 */
export function getGitHubAuthorizationUrl(state: string, redirectUri: string): string {
  const clientId = getGitHubClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo read:user user:email",
    state: state,
    allow_signup: "true",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange temporary authorization code for GitHub access token
 */
export async function exchangeCodeForAccessToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string } | { error: string }> {
  const clientId = getGitHubClientId();
  const clientSecret = getGitHubClientSecret();

  if (!clientId || !clientSecret) {
    return { error: "GitHub OAuth credentials not configured on server." };
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return { error: data.error_description || data.error || "Failed to exchange code for token" };
    }

    return { accessToken: data.access_token };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error exchanging OAuth code";
    return { error: message };
  }
}

/**
 * Fetch user profile information using access token
 */
export async function fetchGitHubUserProfile(accessToken: string): Promise<GitHubUserProfile | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "AgentKit-CICD-Diagnoser",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      login: data.login,
      avatar_url: data.avatar_url,
      name: data.name || null,
      email: data.email || null,
    };
  } catch {
    return null;
  }
}
