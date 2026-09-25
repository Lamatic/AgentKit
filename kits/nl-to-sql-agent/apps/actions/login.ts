'use server';

import { setSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Demo authentication must be explicitly enabled through configuration.
  // Fail closed if configuration is incomplete or disabled.
  const demoAuthEnabled = process.env.DEMO_AUTH_ENABLED === 'true';
  const demoUsername = process.env.DEMO_USERNAME;
  const demoPassword = process.env.DEMO_PASSWORD;

  // Check if demo authentication is available and properly configured.
  if (!demoAuthEnabled) {
    // Demo authentication is disabled or not explicitly enabled.
    // Fail closed: no default credentials are accepted.
    redirect('/login?error=1');
  }

  // Fail closed if credentials are not fully configured.
  if (!demoUsername || !demoPassword) {
    // Configuration incomplete. Do not fall back to defaults.
    // This indicates a server setup issue, not a user input error.
    redirect('/login?error=1');
  }

  if (username === demoUsername && password === demoPassword) {
    // Set the session
    await setSession({ userId: username, isLoggedIn: true, isDemo: true });

    // Redirect to the home page
    redirect('/');
  } else {
    // Redirect back to the login page with an error
    redirect('/login?error=1');
  }
}