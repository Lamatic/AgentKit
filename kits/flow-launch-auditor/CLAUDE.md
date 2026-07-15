# Kit-local implementation exceptions

Flow Launch Auditor deliberately keeps a small, tested surface instead of adopting every shared app convention:

- It pins the deployed, validated Next.js 16 and React 19 versions used by the live challenge demo.
- It uses JavaScript/JSX because the app is small and its public runtime contracts are covered by strict validation and tests.
- It uses native forms and CSS instead of shadcn/ui, react-hook-form, zod, and lucide-react to avoid unnecessary dependencies for one bounded form.
- It retains the tested GraphQL `executeWorkflow` wrapper so the app can enforce its custom timeout, abort propagation, host allowlist, and response-shape validation at the runtime boundary.

These are challenge-kit exceptions, not general AgentKit stack recommendations. Reassess them before expanding the app or promoting it to a shared production service.
