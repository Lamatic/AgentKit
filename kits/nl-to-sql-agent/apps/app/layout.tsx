import { EB_Garamond, Manrope, Fira_Code } from 'next/font/google';
import '../globals.css';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Queryline',
  description: 'Ask questions about your database in plain English',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('nl-to-sql-theme');
                // Normalize the stored theme: only 'dark' and 'light' are
                // accepted directly; every other value (null, 'system', or an
                // unrecognized token) resolves from the OS preference so the
                // pre-hydration result matches ThemeToggle's system handling.
                var useDark = theme === 'dark' ||
                  (theme !== 'light' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (useDark) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${ebGaramond.variable} ${manrope.variable} ${firaCode.variable} min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}