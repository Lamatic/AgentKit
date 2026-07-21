# Google Reviews AI Manager

A full-stack Next.js app that integrates with the Google My Business API and Lamatic AI to automatically draft and post replies to real Google Reviews.

## Features
- **Google OAuth**: Real authentication using Google accounts with `business.manage` scopes.
- **Lamatic AI Generation**: 100% real integration with the Lamatic edge API to generate contextual replies using a deployed Lamatic Studio flow.
- **Real Google Reviews**: Fetches live, real reviews directly from the Google My Business API for your verified business locations.
- **Publish to Google**: End-to-end integration allowing users to review AI drafts, edit them, and publish real replies directly back to Google Maps.

## Quick Start
1. Clone this kit.
2. `cd apps/`
3. `cp .env.example .env.local`
4. Fill in your Google Cloud Console OAuth credentials and Lamatic API keys in `.env.local`.
5. Run `npm install` and then `npm run dev`.
