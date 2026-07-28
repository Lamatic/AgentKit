# Contributing to AgentKit CI/CD Diagnosis Agent

Thank you for your interest in contributing! We welcome bug fixes, feature proposals, documentation improvements, and architectural enhancements.

---

## 🛠️ Development Setup

1. **Fork & Clone Repository**:
   ```bash
   git clone https://github.com/your-username/AgentKit.git
   cd AgentKit/kits/ci-cd-diagnosis-agent/apps
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and add your development keys.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Typecheck & Lint Verification**:
   Before submitting code, always run:
   ```bash
   npm run typecheck
   ```

---

## 📝 Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat`: A new user-facing feature or API capability (e.g. `feat(github): add workflow failure filtering`)
- `fix`: A bug fix (e.g. `fix(auth): handle expired state token gracefully`)
- `docs`: Documentation changes
- `refactor`: Code changes that neither fix a bug nor add a feature
- `style`: Formatting, missing semi-colons, UI tweaks
- `test`: Adding or updating tests

---

## 🔀 Pull Request Process

1. Create a descriptive branch from `main`: `git checkout -b feat/your-feature-name`.
2. Commit your changes following Conventional Commits.
3. Ensure `npm run typecheck` passes with zero errors.
4. Open a Pull Request using the repository PR template.
5. Provide screenshots or video walk-throughs for any UI modifications.
