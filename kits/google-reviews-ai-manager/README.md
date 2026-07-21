<div align="center">
  <img src="apps/public/logo.png" alt="Lamatic Logo" height="60" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png" alt="Google Logo" width="60" height="60" />
  
  <br/>
  <h1>🌟 Google Reviews AI Manager 🌟</h1>
  <p><strong>A production-ready Lamatic AgentKit Submission</strong></p>

  [![Lamatic.ai](https://img.shields.io/badge/Powered_by-Lamatic.ai-blueviolet?style=for-the-badge)](https://lamatic.ai)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Google My Business](https://img.shields.io/badge/API-Google_My_Business-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/my-business)
</div>

<br/>

## 🧠 The Problem
Managing and replying to Google Reviews is a tedious, manual chore for local business owners. Ignoring reviews hurts local SEO and customer trust, but crafting personalized, professional responses for every single review across multiple locations takes hours.

## 🚀 The Solution
The **Google Reviews AI Manager** is a premium, full-stack Next.js dashboard that integrates the **Google My Business API** with the **Lamatic.ai Edge Engine**. It automatically fetches live reviews across all your business locations and uses a deployed Lamatic Studio AI Flow to draft hyper-personalized, context-aware replies. 

With one click, you can review the AI's draft, edit it if necessary, and publish it directly to Google Maps!

---

## ✨ Key Features

- 🔐 **Real Google OAuth Integration**: Securely authenticate using NextAuth with the `business.manage` scope to access real account data.
- 🏢 **Multi-Location Support**: Automatically detects if your Google account manages multiple businesses and provides a beautiful modal to select your location.
- 📊 **Live Analytics Dashboard**: Instantly view metrics like Total Reviews, Average Rating, Replied Count, and Awaiting Reply.
- ⚡ **Lamatic AI Edge Generation**: Triggers a Server Action to communicate with your Lamatic GraphQL endpoint, generating perfectly toned replies based on the reviewer's text and star rating.
- 📝 **Edit & Publish**: A seamless UI allows you to tweak the AI's draft and hit "Publish to Google", instantly posting the reply via the GMB API.
- 🎨 **Premium UI/UX**: Built with Tailwind CSS featuring glassmorphism, responsive grid layouts, automated avatar generation, and token expiry auto-redirects.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router)
- **AI Orchestration:** Lamatic.ai SDK / GraphQL API
- **Authentication:** NextAuth.js (Google Provider)
- **APIs:** Google My Business API, Google My Business Account Management API
- **Styling:** Tailwind CSS + React Icons

---

## 🚦 Quick Start Guide

### 1. Clone & Install
```bash
# Clone your fork of the repository
git clone https://github.com/YOUR-USERNAME/AgentKit.git
cd AgentKit/kits/google-reviews-ai-manager/apps

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your credentials:
- **Google Credentials:** Get your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the [Google Cloud Console](https://console.cloud.google.com/). Ensure the Google My Business API is enabled.
- **Lamatic Credentials:** Get your `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL`, and `LAMATIC_FLOW_ID` from your [Lamatic Studio Dashboard](https://studio.lamatic.ai).

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Click **Sign in with Google**, select your business location, and watch the AI handle your reviews!

---

<div align="center">
  <i>Built with ❤️ for the Lamatic.ai AgentKit Challenge</i>
</div>
