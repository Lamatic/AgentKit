"use client"

import { useMemo, useState } from "react"
import { analyzeInterviewTranscript } from "@/actions/orchestrate"
import { useCameraPreview } from "@/hooks/use-camera-preview"
import { useLiveTranscription } from "@/hooks/use-live-transcription"
import type { AnalysisResult } from "@/lib/analysis-result"

export default function InterviewAutomationPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const {
    videoRef,
    isSupported: isCameraSupported,
    isCameraOn,
    error: cameraError,
    startCamera,
    stopCamera,
  } = useCameraPreview()

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  } = useLiveTranscription()

  const mergedTranscript = useMemo(
    () => `${transcript}${interimTranscript ? ` ${interimTranscript}` : ""}`.trim(),
    [transcript, interimTranscript],
  )

  const handleAnalyze = async () => {
    setAnalysisError("")
    setAnalysisResult(null)

    if (!mergedTranscript.trim()) {
      setAnalysisError("No transcript found. Start speaking first.")
      return
    }

    setIsAnalyzing(true)

    const response = await analyzeInterviewTranscript({
      transcript: mergedTranscript,
    })

    setIsAnalyzing(false)

    if (!response.success) {
      setAnalysisError(response.error || "Analysis failed")
      return
    }

    setAnalysisResult(response.result || null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8">
          <p className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-300">
            Automation Kit
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Interview Automation - Live Transcription</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300">
            Capture speech in real time, review transcript as the interview happens, and run Lamatic analysis for
            summary, interviewer signals, follow-ups, and recommendation.
          </p>
        </header>

        {!isSupported && (
          <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-300/10 p-4 text-sm text-amber-100">
            This browser does not support Web Speech API live recognition. Use Chrome or Edge for local real-time
            transcription.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
        )}

        {cameraError && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {cameraError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Camera Preview</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${
                  isCameraOn ? "bg-cyan-400/20 text-cyan-200" : "bg-zinc-700/60 text-zinc-200"
                }`}
              >
                {isCameraOn ? "Camera On" : "Camera Off"}
              </span>
            </div>

            <div className="mb-5 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {isCameraOn ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  Enable the camera for a more natural interview setup.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={!isCameraSupported || isCameraOn}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Camera
              </button>
              <button
                type="button"
                onClick={stopCamera}
                disabled={!isCameraOn}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stop Camera
              </button>
            </div>
          </article>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">Live Transcript</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    isListening ? "bg-emerald-400/20 text-emerald-200" : "bg-zinc-700/60 text-zinc-200"
                  }`}
                >
                  {isListening ? "Listening" : "Idle"}
                </span>
              </div>

              <div className="mb-5 h-[280px] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-zinc-100">
                {mergedTranscript ? (
                  <>
                    <span>{transcript}</span>
                    {interimTranscript && <span className="text-cyan-300"> {interimTranscript}</span>}
                  </>
                ) : (
                  <span className="text-zinc-400">Start the mic to transcribe interview speech live.</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={start}
                  disabled={!isSupported || isListening}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Live Transcription
                </button>
                <button
                  type="button"
                  onClick={stop}
                  disabled={!isListening}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setAnalysisResult(null)
                    setAnalysisError("")
                  }}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  Reset
                </button>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="mb-4 text-sm text-zinc-300">
                  Analysis uses only the transcript content from the live stream.
                </p>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !mergedTranscript}
                  className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Transcript"}
                </button>

                {analysisError && (
                  <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
                    {analysisError}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h3 className="mb-4 text-base font-medium">Lamatic Analysis</h3>

              {analysisResult ? (
                <div className="max-h-[260px] space-y-4 overflow-y-auto pr-1 text-sm">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Summary</p>
                    <p className="text-zinc-100">{analysisResult.summary}</p>
                  </div>

                  {analysisResult.keySignals && (
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Key Signals</p>
                      <p className="whitespace-pre-wrap text-zinc-100">{analysisResult.keySignals}</p>
                    </div>
                  )}

                  {analysisResult.followUps && (
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Follow-Ups</p>
                      <p className="whitespace-pre-wrap text-zinc-100">{analysisResult.followUps}</p>
                    </div>
                  )}

                  {analysisResult.recommendation && (
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Recommendation</p>
                      <p className="whitespace-pre-wrap text-zinc-100">{analysisResult.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">Run transcript analysis to see the output here.</p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
