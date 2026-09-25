import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import TopNav from '@/app/(protected)/components/TopNav';
import { SessionUserProvider } from '@/components/session-provider';

export const metadata: Metadata = {
  title: 'Queryline',
  description: 'Ask questions about your database in plain English',
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  return (
    <SessionUserProvider userId={session.userId ?? null}>
      <TopNav />
      <main className="w-full flex-1">{children}</main>
    </SessionUserProvider>
  );
}