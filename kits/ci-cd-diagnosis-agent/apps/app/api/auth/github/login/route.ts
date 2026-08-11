import { NextRequest, NextResponse } from "next/server";
import { generateOAuthState, getCanonicalRedirectUri, getGitHubAuthorizationUrl, getGitHubClientId } from "@/lib/auth/github";
import { setOAuthState } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const clientId = getGitHubClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured on this server. GITHUB_CLIENT_ID missing." },
      { status: 500 }
    );
  }

  // 1. Generate CSRF State Token
  const state = generateOAuthState();

  // 2. Store State Token in short-lived HTTP-only cookie
  await setOAuthState(state);

  // 3. Compute Canonical Redirect URI matching registered domain
  const redirectUri = getCanonicalRedirectUri(request.headers, request.nextUrl.origin);

  // 4. Build GitHub Authorization URL
  const authUrl = getGitHubAuthorizationUrl(state, redirectUri);

  // 5. Redirect User to GitHub OAuth Page
  return NextResponse.redirect(authUrl);
}
