# AI Shorts Generator

![Built with Lamatic](https://img.shields.io/badge/Built%20with-Lamatic-5B21B6?style=flat-square)
![Type: Kit](https://img.shields.io/badge/type-kit-0EA5E9?style=flat-square)

> Turn a topic into a short narrated video: Lamatic creates the scene script and images, then the browser records synchronized visuals and voiceover into a downloadable video.

---

## The Problem

Creating a short video normally means writing a script, sourcing visuals, recording narration, and editing them together. That workflow is slow when the goal is a quick explainer, educational clip, or social short.

AI Shorts Generator reduces the first draft to one prompt. It turns a topic into an ordered set of visual scenes with narration, then assembles those scenes into a video in the browser.

---

## What It Does

Enter a topic such as “explain data types in programming.” The Lamatic flow returns scenes with:

| Field | Description |
|-------|-------------|
| `scene_number` | The scene’s order in the video |
| `voiceover_text` | Concise narration for the scene |
| `image_url` | A base64 image data URI, or `null` when an image is unavailable |

The Next.js app then:

1. Saves the latest generated scene set in IndexedDB.
2. Loads the images onto a canvas.
3. Converts each narration segment to audio.
4. Records the canvas video stream and Web Audio stream together.
5. Provides an in-page preview and a download link.

Only one project is stored at a time. Generate a new video only after downloading the current one if you want to keep it.

---

## How It Works

```text
Topic entered in the app
         |
   API Request node (Lamatic trigger)
         |
   Generate scenes node
   — creates ordered narration and image pairs
         |
   API Response node
         |
   Next.js app stores scenes and records image + audio streams
         |
   Preview and download
```

The Lamatic flow is responsible for the creative scene plan. The browser is responsible for video composition and synchronization.

---

## Setup

### Prerequisites

- A [Lamatic.ai](https://lamatic.ai) account
- A deployed Lamatic flow that accepts `sampleInput`
- A text/image-capable model configured for that flow
- Node.js 18 or later

### Step 1 — Build and Deploy the Lamatic Flow

1. Sign in to [Lamatic Studio](https://studio.lamatic.ai) and create a project.
2. Create a flow with three nodes:
   - **API Request** — accepts `sampleInput` as a required string.
   - **Generate scenes** — creates an ordered set of voiceover and image pairs.
   - **API Response** — returns the generated JSON as `output`.
3. Deploy the flow and copy its Flow ID from the flow details panel.

The flow must return this shape:

```json
{
  "output": [
    {
      "scene_number": 1,
      "voiceover_text": "Data types tell a program how to store and use information.",
      "image_url": "data:image/jpeg;base64,..."
    }
  ]
}
```

### Step 2 — Configure the App

```bash
cd apps
cp .env.example .env.local
```

Set the following values in `.env.local`:

```dotenv
LAMATIC_PROJECT_ENDPOINT=https://your-project-endpoint
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_PROJECT_API_KEY=your-api-key
NEXT_PUBLIC_LAMATIC_FLOW_ID=your-deployed-flow-id
```

Find the endpoint, project ID, and API key in Lamatic Studio under **Settings**. The Flow ID is available in the deployed flow’s details panel.

### Step 3 — Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Enter a video topic.
2. Select **Generate** to create scenes.
3. Review the generated scene thumbnails and narration.
4. Select **Create preview**. The app preloads every scene before it starts recording so each image is paired with its corresponding narration.
5. Watch the preview and select **Download video** to save it.

### Example input

```json
{
  "sampleInput": "Explain the difference between integers, strings, and booleans"
}
```

### Example output

```json
{
  "output": [
    {
      "scene_number": 1,
      "voiceover_text": "Every program works with different kinds of values, called data types.",
      "image_url": "data:image/jpeg;base64,..."
    },
    {
      "scene_number": 2,
      "voiceover_text": "Integers hold whole numbers, strings hold text, and booleans represent true or false.",
      "image_url": "data:image/jpeg;base64,..."
    }
  ]
}
```

---

## Video Format

The browser records video with the native `MediaRecorder` API. In Chrome and most Chromium browsers, the broadly supported output is **WebM** with VP9/Opus codecs, so downloads use the `.webm` extension.

This is a browser capability choice, not an operating-system issue. Creating MP4 files requires a separate video-transcoding step, such as FFmpeg on a server.

---

## Notes

- Base64 image data URIs are supported directly. Raw base64 image payloads are also normalized before rendering.
- A scene image is shown for the full duration of its narration.
- Generated images can be portrait or landscape; the preview preserves the entire image rather than cropping it.
- The latest scene set persists across page reloads in the current browser through IndexedDB.
- This kit creates an initial video draft. Review generated text and visuals for accuracy, rights, and brand suitability before publishing.
