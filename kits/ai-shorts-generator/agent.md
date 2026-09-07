# AI Shorts Generator

## What this agent does

AI Shorts Generator turns a short topic or prompt into a sequence of visual scenes for a narrated video short. It creates concise voiceover copy for each scene and pairs it with a generated image, so an application can assemble a complete video with synchronized visuals and audio.

The agent is designed for clear, engaging short-form educational, explanatory, and promotional content. It keeps one coherent idea across the full sequence instead of producing unrelated scenes.

## What it receives

The flow accepts one required input:

- **sampleInput** — a non-empty string describing the requested short, such as “explain data types in programming” or “three facts about coral reefs.”

## What it returns

The flow returns an `output` array. Each entry describes one scene:

```json
{
  "output": [
    {
      "scene_number": 1,
      "voiceover_text": "Data types tell a program what kind of information it is working with.",
      "image_url": "data:image/jpeg;base64,..."
    }
  ]
}
```

- **scene_number** — the scene’s numeric order in the short
- **voiceover_text** — the narration for that scene
- **image_url** — a base64 image data URI for that scene, or `null` when no image is available

## How the flow works

The flow has three stages:

1. **API Request** receives `sampleInput` from the application.
2. **Generate scenes** creates a small, ordered set of concise narration and image pairs based on the topic.
3. **API Response** returns the scene array in the `output` field.

The application stores the returned scenes locally, converts each `voiceover_text` to audio, and records the matching canvas image and audio stream into a downloadable video.

## Quality rules

- Keep the scenes in a logical order with a clear beginning, middle, and ending.
- Make voiceover text brief enough for short-form narration and natural when spoken aloud.
- Ensure each image directly supports its corresponding narration.
- Return the required JSON structure only; do not add Markdown, explanations, or text outside the JSON response.
- Use sequential, unique `scene_number` values.
- Return a valid base64 image data URI when an image is available; otherwise return `null` rather than inventing a URL.

## What it will not do

- Present uncertain, false, or unsafe claims as facts.
- Produce unrelated scene sequences or repeat the same idea without advancing the story.
- Return malformed JSON or omit required scene fields.
- Treat generated images as documentary evidence or as proof that a real event occurred.

## Example

**Input:**

```json
{ "sampleInput": "Explain data types in programming" }
```

**Output:**

```json
{
  "output": [
    {
      "scene_number": 1,
      "voiceover_text": "Data types tell a program how to store and use a piece of information.",
      "image_url": "data:image/jpeg;base64,..."
    },
    {
      "scene_number": 2,
      "voiceover_text": "Numbers work well for calculations, while strings hold text such as names and messages.",
      "image_url": "data:image/jpeg;base64,..."
    }
  ]
}
```
