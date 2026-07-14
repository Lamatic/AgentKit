# TrustGuard AI - Web Application

This is the Next.js frontend web application for **TrustGuard AI**, a multi-stage AI investigation kit that helps detect fraud, phishing, and scams. It provides a clean, dark-themed UI where users can submit suspicious emails, SMS messages, URLs, or documents and receive a structured breakdown of the risk and recommended actions.

This application is built with:
- [Next.js](https://nextjs.org/) (App Router)
- Tailwind CSS v4
- Framer Motion (Animations)
- React Hot Toast

## Running Locally

To run this Next.js project locally, you need to set up your environment variables to connect to your Lamatic AI project.

### 1. Set up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Then, open `.env.local` and configure your Lamatic credentials:
- `LAMATIC_API_KEY`: Your Lamatic project API key
- `LAMATIC_PROJECT_ID`: Your Lamatic project ID
- `LAMATIC_API_URL`: Your Lamatic project endpoint URL
- `TRUSTGUARD_FLOW_ID`: The flow ID of your deployed trustguard-ai flow

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## Committing Changes for PR Merge

If you are contributing to this project and creating a Pull Request, please use clear and descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) format. 

For example, when submitting your PR, use a commit message like:

```
feat(trustguard-ai): update web app UI and fix README
```

- Use `feat:` for new features.
- Use `fix:` for bug fixes.
- Use `docs:` for documentation changes (like updating this README).
- Use `chore:` for updating dependencies or build configurations.
- Include the scope `(trustguard-ai)` to indicate which kit you are modifying.
