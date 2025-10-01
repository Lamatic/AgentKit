# Contributing to Lamatic AgentKit

Thank you for your interest in helping improve **AgentKit**! Contributions are what make the open-source community such a fantastic place to learn, inspire, and create. Any contribution you make will be greatly appreciated.

## Table of Contents
- How to Contribute
- Code of Conduct
- Reporting Bugs
- Suggesting Features & Improvements
- Creating Pull Requests
- Coding Guidelines
- Documentation Updates
- Community & Support
- Attribution

***

## How to Contribute

- **Star** the repo to support the project.
- **Open Issues** for bugs, suggestions, or questions.
- **Fork** the repo and submit a pull request to propose changes.
- Improve documentation, write tutorials, or share use cases.

***

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep this community welcoming and inclusive.

***

## Reporting Bugs

- Ensure the issue doesn’t already exist by searching open and closed issues.
- When filing a bug, include:
  - Steps to reproduce the bug, expected vs. actual behavior
  - Environment info (Node.js version, OS, etc.)
  - Relevant logs or screenshots, if available

***

## Suggesting Features & Improvements

- Ensure similar feature requests don’t already exist.
- Describe the use-case and expected impact clearly.
- Give example workflows or interface ideas if possible.

***

## Creating Pull Requests (PRs)

To contribute improvements, new AgentKits, or fixes, please follow these guidelines:

1. **Fork** the repository and clone your fork.

2. **Create your changes** inside a uniquely named folder within the `/templates/` directory. For example:
   ```
   /templates/<category>/<unique-agentkit-name>/
   ```
   This ensures your AgentKit or feature stays organized and easy to review.

3. Include any relevant code, assets, configuration, or documentation needed for your AgentKit.

4. **Test locally** that your AgentKit deploys and runs as expected.

5. **Commit your changes** with clear, descriptive commit messages.

6. **Push your branch** to your fork.

7. **Open a Pull Request** against the main repository, clearly describing:
   - The purpose of your AgentKit or fix
   - Key features or changes
   - Any setup steps or dependencies the reviewer should know

8. The maintainers will review your PR, provide feedback if necessary, and merge when approved.


## Building Your Own AgentKit

Want to create a custom AgentKit from scratch? We've provided a starter template to help you get started quickly!

1. **Use the sample template** located at `/templates/sample/` as your starting point. This is a Next.js project skeleton pre-configured with the essential structure for building AgentKits.

2. **Copy the template** to create your new AgentKit:
   ```bash
   cp -r templates/sample/<your-agentkit-name>
   ```

3. **Customize your kit** by:
   - Adding your orchestrator logic in the `/actions` directory
   - Building your UI components in the `/app` directory
   - Integrating Lamatic API wrappers in the `/lib` directory
   - Configuring your flow in `lamatic-config.json`

4. **Set up your environment** by creating a `.env` file with required API keys:
   ```bash
   LAMATIC_API_KEY=your_key_here
   ```

5. **Install dependencies and run locally**:
   ```bash
   npm install
   npm run dev
   ```

6. **Test thoroughly** to ensure all features work as expected before submitting.

7. **Document your kit** by updating the README with:
   - Clear description of what your AgentKit does
   - Setup instructions and prerequisites
   - Usage examples and screenshots
   - Any special configuration or dependencies

8. **Submit your AgentKit** by following the Pull Request guidelines above.

We're excited to see what you build! If you have questions or need help, feel free to open an issue or reach out to the maintainers.

***
## Coding Guidelines

- Write clear, maintainable, and well-documented code.
- Follow code style conventions used elsewhere in the repo.
- Add or update tests where relevant.
- Keep pull requests focused and minimal.

***

## Documentation Updates

- Help us keep documentation up to date.
- Update usage examples, configuration details, or the architecture diagram as needed.
- Contributions to guides, tutorials, and case studies are welcome.

***

## Community & Support

- Join discussions on [GitHub Discussions](https://github.com/Lamatic/AgentKit/discussions).
- Reach out with questions, ideas, or feedback.

***

## Attribution

Adapted from best practices recommended by the open-source community. See awesome lists at [github.com/mntnr/awesome-contributing](https://github.com/mntnr/awesome-contributing).

***

We appreciate your efforts to improve Lamatic AgentKit!
