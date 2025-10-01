# Template Kit

This is a starter AgentKit template. Use this as a reference when creating new agent kits.

## Folder Structure

```
/actions                 # Orchestrator / agent actions
/app                     # Next.js UI
/lib                     # Lamatic API client wrappers
/public/assets           # Optional static assets
/lamatic-config.json     # Sample Lamatic flow configuration
/package.json            # Scripts & dependencies
```

## Setup

### 1. Copy the Template

Copy this folder to `/templates/<your-kit-name>`

### 2. Configure Environment Variables

Create a `.env` file and add your configuration:

```bash
LAMATIC_API_KEY=your_key_here
```

### 3. Configure Lamatic Flow

Replace `lamatic-config.json` with your own flow configuration from Lamatic Studio.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Follow `CONTRIBUTING.md` for guidelines.

---

## Creating a New AgentKit

### Step-by-Step Guide

1. **Copy the template kit folder** in `/templates`:

```bash
cp -r templates/template-kit templates/my-new-kit
```

2. **Rename files** if needed and update `package.json` name.

3. **Replace configuration** - Replace `lamatic-config.json` with your exported Lamatic Studio flow.

4. **Configure environment** - Follow the README in the kit to configure `.env` and run locally.

5. **Commit and push** your new kit to the repository.

---

## Additional Resources

- Refer to the main documentation for more details
- Check existing kits for examples and best practices
- Join our community for support and discussions