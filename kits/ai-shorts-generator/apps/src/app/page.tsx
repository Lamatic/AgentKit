"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Scene = { scene_number: number; voiceover_text: string; image_url: string | null };
const DB_NAME = "ai-shorts-generator";
const STORE_NAME = "projects";
const PROJECT_KEY = "latest-scenes";
const topicSchema = z.object({
  sampleInput: z.string().trim().min(1, "Enter a topic for your video.").max(500, "Keep the topic under 500 characters."),
});
type TopicForm = z.infer<typeof topicSchema>;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveScenes(scenes: Scene[]) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(scenes, PROJECT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function clearSavedProject() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(PROJECT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function loadScenes(): Promise<Scene[] | null> {
  const database = await openDatabase();
  const scenes = await new Promise<Scene[] | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(PROJECT_KEY);
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result as Scene[] : null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return scenes;
}

function imageSource(imageUrl: string): string {
  const value = imageUrl.trim();
  if (value.startsWith("data:image/")) return value;
  // Some flows return the base64 payload without its data-URI prefix.
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return `data:image/jpeg;base64,${value}`;
  return value;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!url.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This scene image could not be opened for the video."));
    image.src = imageSource(url);
  });
}

function audioEnded(source: AudioBufferSourceNode): Promise<void> {
  return new Promise((resolve) => { source.onended = () => resolve(); });
}

export default function Home() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<TopicForm>({
    resolver: zodResolver(topicSchema),
    defaultValues: { sampleInput: "" },
  });

  useEffect(() => {
    loadScenes().then((saved) => saved && setScenes(saved)).catch(() => undefined);
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  async function handleGenerate({ sampleInput }: TopicForm) {
    setLoading(true); setError(null);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = null;
    setVideoUrl(null);
    setScenes([]);
    await clearSavedProject().catch(() => undefined);
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleInput }),
      });
      const data = await response.json().catch(() => null) as { output?: Scene[]; error?: string } | null;
      if (!response.ok || !data?.output) throw new Error(data?.error ?? "The server returned an unreadable response. Please try again.");
      setScenes(data.output);
      await saveScenes(data.output);
    } catch (reason) {
      setError(reason instanceof TypeError && reason.message === "Failed to fetch"
        ? "Your browser could not reach this app. Check that the development server is still running, then try again."
        : reason instanceof Error ? reason.message : "We could not generate scenes. Please try again.");
    } finally { setLoading(false); }
  }

  function splitNarration(text: string): string[] {
    const words = text.trim().split(/\s+/);
    const chunks: string[] = [];
    let current = "";
    for (const word of words) {
      if (current && `${current} ${word}`.length > 180) {
        chunks.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  async function fetchTts(text: string): Promise<ArrayBuffer[]> {
    const chunks = splitNarration(text);
    return Promise.all(chunks.map(async (chunk) => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsText: chunk }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "The narration service could not create audio for this scene.");
      }
      return response.arrayBuffer();
    }));
  }

  function drawScene(context: CanvasRenderingContext2D, scene: Scene, image: HTMLImageElement | null) {
    const { width, height } = context.canvas;
    context.fillStyle = "#171717";
    context.fillRect(0, 0, width, height);
    if (image) {
      const scale = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * scale, drawHeight = image.height * scale;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }
  }

  async function createVideo() {
    const canvas = canvasRef.current;
    if (!canvas || !scenes.length) return;
    setRendering(true); setError(null);
    let context: AudioContext | null = null;
    let stream: MediaStream | null = null;
    try {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
      setVideoUrl(null);
      const drawingContext = canvas.getContext("2d");
      if (!drawingContext) throw new Error("Canvas is not supported in this browser.");
      const AudioContextClass = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio is not supported in this browser.");
      context = new AudioContextClass();
      await context.resume();
      // Load every asset first. Recording never begins with an empty canvas or missing narration.
      const preparedScenes: Array<{ scene: Scene; image: HTMLImageElement | null; audioBuffers: AudioBuffer[] }> = [];
      for (const scene of scenes) {
        const [audioParts, image] = await Promise.all([
          fetchTts(scene.voiceover_text),
          scene.image_url ? loadImage(scene.image_url) : Promise.resolve(null),
        ]);
        const audioBuffers = await Promise.all(audioParts.map((part) => context!.decodeAudioData(part.slice(0))));
        preparedScenes.push({ scene, image, audioBuffers });
      }

      const audioDestination = context.createMediaStreamDestination();
      const videoStream = canvas.captureStream(30);
      stream = new MediaStream([...videoStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()]);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const finished = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });

      // Capture the visible canvas and Web Audio destination as one stream for a synchronized video file.
      recorder.start();
      for (const { scene, image, audioBuffers } of preparedScenes) {
        drawScene(drawingContext, scene, image);
        const videoTrack = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
        videoTrack?.requestFrame?.();
        for (const audioBuffer of audioBuffers) {
          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(context.destination);
          source.connect(audioDestination);
          source.start();
          // The next image is not drawn until this audio has completely finished.
          await audioEnded(source);
        }
      }
      recorder.stop();
      const video = await finished;
      const nextVideoUrl = URL.createObjectURL(video);
      videoUrlRef.current = nextVideoUrl;
      setVideoUrl(nextVideoUrl);
    } catch (reason) {
      setError(reason instanceof TypeError && reason.message === "Failed to fetch"
        ? "We could not reach the narration service. Check your internet connection and try again."
        : reason instanceof Error ? reason.message : "We could not create the video. Please try again.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      await context?.close();
      setRendering(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="app-header">
          <p className="eyebrow">AI SHORTS</p>
          <h1>Create a narrated video</h1>
        </header>
        <form onSubmit={handleSubmit(handleGenerate)} className="topic-form">
          <label htmlFor="sampleInput">Describe your video</label>
          <div className="topic-form-row">
            <input id="sampleInput" {...register("sampleInput")} disabled={loading || rendering} placeholder="For example: explain data types in programming" />
            <button className="primary-button" disabled={loading || rendering}>{loading ? "Generating…" : "Generate"}</button>
          </div>
          {errors.sampleInput && <p role="alert" className="form-error">{errors.sampleInput.message}</p>}
          <p className="form-note">Creating a new video replaces the saved project. Download the current video first.</p>
        </form>
        {error && <p role="alert" className="app-error">{error}</p>}
        <div className="workspace">
          <section className="video-panel">
            <canvas ref={canvasRef} width={1280} height={720} className={`video-canvas${videoUrl ? " is-hidden" : ""}`} aria-label="Live video preview" />
            {videoUrl ? <video src={videoUrl} controls className="video-player" /> : !rendering && <div className="video-placeholder">{scenes.length ? "Ready to create preview" : "Your video preview will appear here"}</div>}
          </section>
          <aside className="scene-panel">
            <h2>Scenes</h2>
            <p className="scene-count">{scenes.length ? `${scenes.length} scenes saved locally` : "Generate a video to begin."}</p>
            <ol className="scene-list">{scenes.map((scene) => <li key={scene.scene_number} className="scene-item">{scene.image_url ? <img src={imageSource(scene.image_url)} alt="Generated scene" className="scene-image" /> : <div className="scene-image scene-image-empty" />}<span>{scene.voiceover_text}</span></li>)}</ol>
            <button onClick={createVideo} disabled={!scenes.length || rendering} className="primary-button create-preview-button">{rendering ? "Creating preview…" : "Create preview"}</button>
            {videoUrl && <a href={videoUrl} download="ai-short.webm" className="download-button">Download video</a>}
          </aside>
        </div>
      </section>
    </main>
  );
}
