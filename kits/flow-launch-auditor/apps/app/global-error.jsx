"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Flow Launch Auditor global render failed:", {
      name: error?.name,
      digest: error?.digest
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="shell">
          <section className="errorPage">
            <p className="eyebrow">Launch Readiness</p>
            <h1>Audit shell failed</h1>
            <p>The local auditor shell hit an unexpected render error.</p>
            {error?.digest && (
              <p className="errorDigest">
                Error digest: <code>{error.digest}</code>
              </p>
            )}
            <button className="primaryButton" type="button" onClick={reset}>
              Try Again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
