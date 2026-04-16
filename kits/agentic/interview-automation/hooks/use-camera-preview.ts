"use client"

import { useEffect, useRef, useState } from "react"

export function useCameraPreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isSupported, setIsSupported] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setIsSupported(Boolean(navigator.mediaDevices?.getUserMedia))

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const videoElement = videoRef.current
    const stream = streamRef.current

    if (!videoElement || !stream) {
      return
    }

    videoElement.srcObject = stream
    void videoElement.play().catch(() => undefined)
  }, [isCameraOn])

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera preview is not supported in this browser.")
      return
    }

    setError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream

      setIsCameraOn(true)
    } catch {
      setError("Unable to access camera. Check browser permissions and try again.")
      setIsCameraOn(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraOn(false)
  }

  return {
    videoRef,
    isSupported,
    isCameraOn,
    error,
    startCamera,
    stopCamera,
  }
}