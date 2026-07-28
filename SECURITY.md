# Security Policy

The AgentKit CI/CD Diagnosis Agent takes security seriously. As a tool designed to analyze build logs and system execution context, maintaining strict data privacy, credential protection, and threat mitigation is a primary design goal.

---

## 🔒 Security Architecture Guarantees

1. **In-Memory Zero Temporary Footprint**:
   - All GitHub Actions `.zip` log extraction occurs directly in RAM using WebAssembly/JS streaming zip decompression (`fflate`).
   - Log files are never written to disk or temporary file system storage.

2. **Automated Secret Redaction**:
   - Every log stream is passed through a secret sanitizer before reaching the AI model.
   - Redacts AWS Access Keys (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`), Bearer authorization headers, and custom user secrets.

3. **Session & Cookie Security**:
   - GitHub OAuth sessions are sealed using AES-256-GCM authenticated encryption.
   - Session cookies enforce `HttpOnly`, `Secure`, and `SameSite=Lax` protection.

4. **OWASP HTTP Security Headers**:
   - Configured with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

---

## 🐞 Reporting Vulnerabilities

If you discover a potential security vulnerability in this project, please do **NOT** open a public GitHub issue.

Instead, please report security concerns directly to the maintainers via security report or email. We will acknowledge receipt within 24 hours and provide regular status updates regarding resolution.
