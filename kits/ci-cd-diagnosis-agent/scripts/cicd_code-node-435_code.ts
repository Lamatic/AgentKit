const mockedKnowledge = `
1. Docker Exit Code 137: Container process killed by OS kernel OOM killer. Fix: Increase runner memory or optimize build.
2. Docker No Space Left On Device: Container host ran out of disk space during build. Fix: Run 'docker image prune -af' before build.
3. npm ERESOLVE Peer Dependency Conflict: Packages require incompatible versions. Fix: Use 'npm ci --legacy-peer-deps' or upgrade root packages.
4. GitHub Actions YAML Syntax Error: Fix: Replace tab characters with spaces and ensure strings with colons are quoted.
5. Permission Denied Shell Script: Script failed with Permission denied. Fix: Run 'git update-index --chmod=+x script.sh'.
`;

output = { knowledge_retrieval_results: mockedKnowledge };
