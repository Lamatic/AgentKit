"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useApp } from "../contexts/AppContext"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { setImage } = useApp()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const uploadImageToServer = async (base64String: string) => {
    setIsUploading(true)
    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: base64String,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url: imageUrl } = await response.json()
      console.log("=== IMAGE UPLOAD SUCCESS ===")
      console.log("Generated URL:", imageUrl)
      console.log("URL stored in context for next pages")
      console.log("===========================")
      
      // Store the URL instead of base64
      setImage(imageUrl)
      setUploadedImage(base64String) // Keep base64 for preview only
      
      return imageUrl
    } catch (error) {
      console.error("Upload error:", error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target?.result as string
        await uploadImageToServer(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target?.result as string
        await uploadImageToServer(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-gray-800/20" />
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6 text-orange-400 hover:text-orange-300 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Upload Your <span className="text-white">Photo</span>
          </h1>
        </div>
        {/* Upload Area */}
        <div className="max-w-2xl mx-auto">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragActive
                ? "border-orange-400 bg-orange-500/10"
                : "border-gray-600 hover:border-orange-500 bg-gray-900/30"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-6">
                <div className="text-6xl animate-pulse">⏳</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Uploading...</h3>
                  <p className="text-gray-400">Please wait while we process your image</p>
                </div>
              </div>
            ) : uploadedImage ? (
              <div className="space-y-6">
                <img
                  src={uploadedImage || "/placeholder.svg"}
                  alt="Uploaded photo"
                  className="w-full max-w-md max-h-[60vh] mx-auto rounded-lg shadow-lg object-contain"
                />
                <div className="space-y-4">
                  <p className="text-green-400 font-semibold">Photo uploaded successfully!</p>
                  <Link href="/themes">
                    <button className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      Continue
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-6xl">📸</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Drop your photo here</h3>
                  <p className="text-gray-400">or click to browse your files</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex justify-center">
                  <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-yellow-400">
                    Choose File 🎃
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Instructions */}
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Supported formats: JPG, PNG • Max size: 10MB</p>
       
          </div>
        </div>
      </div>
    </div>
  )
}
