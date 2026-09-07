"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Scene = { scene_number: number; voiceover_text: string; image_url: string | null };
const DB_NAME = "ai-shorts-generator";
const STORE_NAME = "projects";
const PROJECT_KEY = "latest-scenes";

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
  const [sampleInput, setSampleInput] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadScenes().then((saved) => saved && setScenes(saved)).catch(() => undefined);
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sampleInput.trim()) return;
    setLoading(true); setError(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setScenes([]);
    await clearSavedProject().catch(() => undefined);
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleInput: sampleInput.trim() }),
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
    try {
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
      const stream = new MediaStream([...videoStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()]);
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
      setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(video); });
      stream.getTracks().forEach((track) => track.stop());
    } catch (reason) {
      setError(reason instanceof TypeError && reason.message === "Failed to fetch"
        ? "We could not reach the narration service. Check your internet connection and try again."
        : reason instanceof Error ? reason.message : "We could not create the video. Please try again.");
    } finally {
      await context?.close();
      setRendering(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <header className="border-b border-neutral-800 pb-6">
          <p className="text-sm font-medium tracking-wide text-neutral-400">AI SHORTS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Create a narrated video</h1>
        </header>
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <label htmlFor="sampleInput" className="mb-2 block text-sm font-medium text-neutral-200">Describe your video</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="sampleInput" value={sampleInput} onChange={(event) => setSampleInput(event.target.value)} required placeholder="For example: explain data types in programming" className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none focus:border-neutral-400" />
            <button disabled={loading} className="rounded-md bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Generating…" : "Generate"}</button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">Creating a new video replaces the saved project. Download the current video first.</p>
        </form>
        {error && <p role="alert" className="mt-5 rounded-md border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="relative aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-black">
            {videoUrl ? <video src={videoUrl} controls className="h-full w-full bg-black object-contain" /> : <><canvas ref={canvasRef} width={1280} height={720} className="h-full w-full bg-black object-contain" aria-label="Live video preview" />{!rendering && <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">{scenes.length ? "Ready to create preview" : "Your video preview will appear here"}</div>}</>}
          </section>
          <aside className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="font-medium">Scenes</h2>
            <p className="mt-1 text-sm text-neutral-500">{scenes.length ? `${scenes.length} scenes saved locally` : "Generate a video to begin."}</p>
            <ol className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">{scenes.map((scene) => <li key={scene.scene_number} className="flex gap-3 text-sm leading-5 text-neutral-300">{scene.image_url ? <img src={imageSource(scene.image_url)} alt="Generated scene" className="h-12 w-16 shrink-0 rounded bg-black object-contain" /> : <div className="h-12 w-16 shrink-0 rounded bg-neutral-800" />}<span>{scene.voiceover_text}</span></li>)}</ol>
            <button onClick={createVideo} disabled={!scenes.length || rendering} className="mt-5 w-full rounded-md bg-white px-4 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50">{rendering ? "Creating preview…" : "Create preview"}</button>
            {videoUrl && <a href={videoUrl} download="ai-short.webm" className="mt-3 block w-full rounded-md border border-neutral-600 px-4 py-3 text-center font-medium text-white transition hover:bg-neutral-800">Download video</a>}
          </aside>
        </div>
      </section>
    </main>
  );
}
