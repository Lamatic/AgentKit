"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Flow Launch Auditor render failed:", {
      name: error?.name,
      digest: error?.digest
    });
  }, [error]);

  return (
    <main className="shell">
      <section className="errorPage">
        <p className="eyebrow">Launch Readiness</p>
        <h1>Audit view failed</h1>
        <p>The local auditor view hit an unexpected render error.</p>
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
  );
}
