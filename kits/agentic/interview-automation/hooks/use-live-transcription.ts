"use client"

import { useEffect, useRef, useState } from "react"

type RecognitionType = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => RecognitionType
    SpeechRecognition?: new () => RecognitionType
  }
}

export function useLiveTranscription() {
  const recognitionRef = useRef<RecognitionType | null>(null)

  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionImpl) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let finalChunk = ""
      let interimChunk = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        // console.log("[v0] Recognition result:", event.results[index])
        const result = event.results[index]
        const text = result[0]?.transcript || ""
        // console.log(`[v0] Recognized text (final: ${result.isFinal}):`, text)

        if (result.isFinal) {
          finalChunk += `${text} `
        } else {
          interimChunk += text
        }
      }

      if (finalChunk) {
        setTranscript((current) => `${current} ${finalChunk}`.replace(/\s+/g, " ").trim())
      }

      setInterimTranscript(interimChunk)
    }

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error || "unknown"}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript("")
    }

    recognitionRef.current = recognition
    setIsSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const start = () => {
    if (!recognitionRef.current) {
      return
    }

    setError("")

    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      setError("Unable to start recognition. If already running, stop and retry.")
    }
  }

  const stop = () => {
    if (!recognitionRef.current) {
      return
    }

    recognitionRef.current.stop()
    setIsListening(false)
  }

  const reset = () => {
    setTranscript("")
    setInterimTranscript("")
    setError("")
  }

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  }
}
