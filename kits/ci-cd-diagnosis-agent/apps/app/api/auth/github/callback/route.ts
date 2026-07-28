import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForAccessToken, fetchGitHubUserProfile } from "@/lib/auth/github";
import { popOAuthState, setSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const homeUrl = new URL("/", request.url);

  // 1. Handle user cancellation or GitHub OAuth errors
  if (error) {
    homeUrl.searchParams.set("auth_error", errorDescription || error || "OAuth cancelled");
    return NextResponse.redirect(homeUrl);
  }

  if (!code || !state) {
    homeUrl.searchParams.set("auth_error", "Invalid OAuth callback response parameters.");
    return NextResponse.redirect(homeUrl);
  }

  // 2. CSRF State Validation
  const savedState = await popOAuthState();
  if (!savedState || savedState !== state) {
    homeUrl.searchParams.set("auth_error", "CSRF state validation failed. Please try logging in again.");
    return NextResponse.redirect(homeUrl);
  }

  // 3. Exchange Code for Access Token
  const redirectUri = `${url.origin}/api/auth/github/callback`;
  const tokenResult = await exchangeCodeForAccessToken(code, redirectUri);

  if ("error" in tokenResult) {
    homeUrl.searchParams.set("auth_error", tokenResult.error);
    return NextResponse.redirect(homeUrl);
  }

  // 4. Fetch User Profile
  const profile = await fetchGitHubUserProfile(tokenResult.accessToken);
  if (!profile) {
    homeUrl.searchParams.set("auth_error", "Failed to fetch GitHub user profile.");
    return NextResponse.redirect(homeUrl);
  }

  // 5. Seal Session into HTTP-only cookie (Never expose token to client)
  await setSession({
    accessToken: tokenResult.accessToken,
    user: {
      login: profile.login,
      avatarUrl: profile.avatar_url,
      name: profile.name || undefined,
      email: profile.email || undefined,
    },
  });

  // 6. Redirect back to homepage on success
  homeUrl.searchParams.set("auth_success", "true");
  return NextResponse.redirect(homeUrl);
}
