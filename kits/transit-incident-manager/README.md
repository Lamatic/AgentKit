# Transit Incident Manager

<p align="center">
  <a href="https://transit-incident-manager.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

**Transit Incident Manager** is an AI-powered transit incident response system built with [Lamatic.ai](https://lamatic.ai). It provides a dashboard for reporting transit disruptions and uses an intelligent Lamatic workflow to generate an alternate route and a passenger communication message based on the incident details.

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the required flow in Lamatic and wire its configuration into this codebase.

### Pre: Build in Lamatic

1. Sign in or sign up at [Lamatic.ai](https://lamatic.ai).
2. Create a project if you don't have one yet.
3. Create a new flow for the Transit Incident Manager.
4. Configure the flow to process the transit incident information.
5. Configure the workflow to generate:

   * An alternate route for the affected service.
   * A passenger-facing apology/notification message.
6. Deploy the flow in Lamatic.
7. Obtain the required project and flow configuration values.

### Post: Wire into this repo

1. Create a `.env.local` file and configure the Lamatic environment variables.
2. Install and run the project locally:

   * `npm install`
   * `npm run dev`
3. Deploy the application:

   * Vercel is recommended.
   * Set the project's Root Directory to `kits/transit-incident-manager`.
   * Add the required environment variables in Vercel.
   * Deploy and test the live URL.

---

## 🔑 Setup

### Required Keys and Config

You'll need the following Lamatic configuration values to run this project locally:

| Item                                | Purpose                                                | Where to Get It |
| ----------------------------------- | ------------------------------------------------------ | --------------- |
| `LAMATIC_API_KEY`                   | Authentication for Lamatic API access                  | Lamatic Studio  |
| `LAMATIC_PROJECT_ID`                | Identifies the Lamatic project                         | Lamatic Studio  |
| `LAMATIC_ENDPOINT`                  | Lamatic API endpoint used by the application           | Lamatic Studio  |
| `TRANSIT_INCIDENT_RESPONSE_FLOW_ID` | Identifies the deployed transit incident response flow | Lamatic Studio  |

### 1. Environment Variables

Create `.env.local` with:

```bash
# Lamatic
LAMATIC_API_KEY=
LAMATIC_PROJECT_ID=
LAMATIC_ENDPOINT=
TRANSIT_INCIDENT_RESPONSE_FLOW_ID=
```

You can use the included `.env.example` file as a template.

> **Important:** Never commit `.env.local` or actual API keys/secrets to GitHub.

### 2. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🚌 Transit Incident Manager

The dashboard allows a transit operator to provide information about a service disruption, including the affected bus, route, stop, incident type, and estimated delay.

The incident is then sent to the Lamatic workflow, which processes the information and generates the required response.

### Incident Response Flow

```text
Transit Operator
       │
       ▼
Transit Incident Dashboard
       │
       ▼
Trigger Delay Alert
       │
       ▼
Next.js API Route
       │
       ▼
Lamatic Incident Response Flow
       │
       ├── Generate Alternate Route
       │
       └── Generate Passenger Message
       │
       ▼
Response displayed in Dashboard
```

---

## 📍 Demo Transit Data

The project includes demo transit routes and stops based on Udaipur, Rajasthan.

Example routes include:

* Route 001 — Badgaon → Titardi
* Route 002 — Badi → Geetanjali Hospital
* Route 003 — Pratap Nagar → Udaipur Railway Station
* Route 004 — Fatehpura → Hiran Magri
* Route 005 — Shilpgram → Surajpole

This demo data allows the dashboard to be tested without requiring a live transit data source.

---

## 📂 Repo Structure

```text
/transit-incident-manager
├── /app
│   ├── /api
│   │   └── /incident
│   └── page.tsx
├── /components
├── /data
│   └── routes.ts
├── /public
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Deployment

The project is configured for deployment using Vercel.

### Vercel Configuration

**Production Branch:**

```text
feat/transit-incident-manager
```

**Root Directory:**

```text
kits/transit-incident-manager
```

The required Lamatic environment variables must also be added to the Vercel project before the deployed incident workflow can be used.

---

## 🤝 Contributing

We welcome contributions!

Please refer to the repository's [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for the contribution guidelines and pull request process.

When contributing:

1. Create a feature branch.
2. Make your changes.
3. Test the project locally.
4. Commit and push your changes.
5. Open a pull request following the repository guidelines.

---

## 📜 License

This project follows the license of the parent AgentKit repository.
