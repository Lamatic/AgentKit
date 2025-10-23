"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useApp } from "../contexts/AppContext"
import { Spinner } from "../../components/spinner"
import { ChevronLeft, ChevronRight, Share2, ArrowLeft, ShoppingCart, Hammer, Copy, Check, X } from "lucide-react"
import { executeAIProcessing, executeCostumeDesigner } from "@/actions/orchestrate"
import { uploadMultipleImagesToBlob } from "@/actions/upload-images"
import { MarkdownRenderer } from "@/components/markdown-renderer"

function extractImagesFromLamaticResponse(result: any): string[] {
  const images: string[] = []

  if (!result || typeof result !== "object") return images

  const knownKeys = ["image", "img1", "img2", "img3", "img4", "img5", "img6", "img7"]

  for (const key of knownKeys) {
    const value = result[key]

    if (Array.isArray(value) && value.length > 0) {
      const firstElement = value[0]

      if (typeof firstElement === "string" && firstElement.trim()) {
        const imageData = firstElement.startsWith("data:image/")
          ? firstElement
          : `data:image/png;base64,${firstElement}`
        images.push(imageData)
      }
    }
  }

  console.log("[v0] Extracted images from Lamatic response:", images.length)
  return images
}

export default function ImagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sharedImageUrl = searchParams.get("img") || searchParams.get("shared")
  const sharedTheme = searchParams.get("theme")

  const {
    image,
    theme,
    generatedImages: cachedImages,
    setGeneratedImages: setCachedImages,
    clearCache,
    setSelectedImage,
  } = useApp()

  const isImageUrl = image && (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("blob:"))

  // Only process base64 if it's not a URL
  let processedImage = image
  if (!isImageUrl && image) {
    // If it's a data URL, extract the base64 part
    if (image.startsWith("data:")) {
      processedImage = image.split(",")[1] || image
    }
  }

  const [generatedImages, setGeneratedImages] = useState<string[]>(cachedImages)
  const [isLoading, setIsLoading] = useState(false)
  const effectRan = useRef(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isViewingShared, setIsViewingShared] = useState(false)
  const [selectedImageForDesign, setSelectedImageForDesign] = useState<string | null>(null)
  const [showDesignButtons, setShowDesignButtons] = useState(false)
  const [designResults, setDesignResults] = useState<any>(null)
  const [designMode, setDesignMode] = useState<"make" | "buy" | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("Generating images...")
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (sharedImageUrl && !effectRan.current) {
      effectRan.current = true
      setIsViewingShared(true)
      setIsLoading(true)

      fetch(sharedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            setGeneratedImages([base64])
            setCurrentImageIndex(0)
            setIsLoading(false)
          }
          reader.readAsDataURL(blob)
        })
        .catch((err) => {
          console.error("Failed to load shared image:", err)
          setIsLoading(false)
        })
    }
  }, [sharedImageUrl])

  useEffect(() => {
    if (isViewingShared || effectRan.current) return
    if (image && theme) {
      effectRan.current = true

      console.log("[v0] === CACHE CHECK START ===")
      console.log("[v0] Cached images in context:", cachedImages.length)

      if (cachedImages.length > 0) {
        console.log("[v0] ✅ CACHE HIT! Loading", cachedImages.length, "cached images WITHOUT API CALL")
        setGeneratedImages(cachedImages)
        setCurrentImageIndex(0)
        console.log("[v0] === CACHE CHECK END (SUCCESS) ===")
        return
      }

      console.log("[v0] === CACHE CHECK END (MISS) - Making API call ===")
      callLamatic()
    }
  }, [image, theme, isViewingShared])

  async function compressBase64Jpeg(base64NoPrefix: string, maxW = 800, quality = 0.6): Promise<string> {
    try {
      const dataUrl = `data:image/jpeg;base64,${base64NoPrefix}`
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.crossOrigin = "anonymous"
        el.src = dataUrl
      })
      const scale = img.width > maxW ? maxW / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return base64NoPrefix
      ctx.drawImage(img, 0, 0, w, h)
      const outUrl = canvas.toDataURL("image/jpeg", quality)
      return outUrl.split(",")[1] || base64NoPrefix
    } catch (err) {
      console.error("[v0] Compression failed:", err)
      return base64NoPrefix
    }
  }

  async function callLamatic() {
    try {
      setIsLoading(true)
      setLoadingMessage("Generating images...")

      let imageToSend = isImageUrl ? image : processedImage

      console.log("[v0] === IMAGE TO LAMATIC ===")
      console.log("[v0] Image type:", isImageUrl ? "URL" : "Base64")
      console.log("[v0] Image value:", isImageUrl ? imageToSend : `${imageToSend?.substring(0, 50)}...`)
      console.log("[v0] ========================")

      if (!isImageUrl && imageToSend && imageToSend.length > 500_000) {
        console.log("[v0] Input image large (>500KB), compressing before upload…")
        imageToSend = await compressBase64Jpeg(imageToSend, 800, 0.6)
        console.log("[v0] Compressed image size:", imageToSend.length, "characters")
      }

      const result = await executeAIProcessing({
        image: imageToSend,
        theme: theme || "halloween",
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to generate images")
      }

      console.log("[v0] Lamatic SDK result:", result.data)

      const extractedImages = extractImagesFromLamaticResponse(result.data?.result || result.data)

      if (extractedImages.length === 0) {
        throw new Error("No images were generated")
      }

      // **NEW: Compress all generated images before upload**
      console.log("[v0] Compressing", extractedImages.length, "generated images before upload...")
      setLoadingMessage("Compressing images...")
      
      const compressedImages = await Promise.all(
        extractedImages.map(async (img) => {
          try {
            // Extract base64 data
            const base64Data = img.startsWith("data:image/") ? img.split(",")[1] : img
            // Compress it
            const compressed = await compressBase64Jpeg(base64Data, 1024, 0.7)
            // Return as data URL
            return `data:image/jpeg;base64,${compressed}`
          } catch (err) {
            console.error("[v0] Failed to compress image, using original:", err)
            return img
          }
        })
      )
      
      console.log("[v0] Compression complete, uploading images one by one...")

      // Upload images one at a time to avoid 413 errors
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < compressedImages.length; i++) {
        try {
          setLoadingMessage(`Uploading images...`)
          
          const response = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Data: compressedImages[i] }),
          })
          
          if (response.ok) {
            const { url } = await response.json()
            uploadedUrls.push(url)
            console.log(`[v0] Uploaded image ${i + 1}/${compressedImages.length}`)
          } else {
            console.error(`[v0] Failed to upload image ${i + 1}`)
          }
        } catch (err) {
          console.error(`[v0] Error uploading image ${i + 1}:`, err)
        }
      }

      if (uploadedUrls.length > 0) {
        console.log("[v0] Successfully uploaded", uploadedUrls.length, "images")
        
        setLoadingMessage("Loading images...")
        console.log("[v0] Preloading", uploadedUrls.length, "images before display...")

        const preloadPromises = uploadedUrls.map((url, index) => {
          return new Promise<void>((resolve) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
              console.log("[v0] Preloaded image", index + 1, "of", uploadedUrls.length)
              resolve()
            }
            img.onerror = () => {
              console.error("[v0] Failed to preload image", index + 1, "- continuing anyway")
              resolve()
            }
            img.src = url
          })
        })

        await Promise.all(preloadPromises)
        console.log("[v0] All images preloaded successfully")

        setGeneratedImages(uploadedUrls)
        setCachedImages(uploadedUrls)
        setCurrentImageIndex(0)
        console.log("[v0] Saved to context cache:", uploadedUrls.length, "images")
      } else {
        // Fallback to compressed data URLs if upload completely fails
        console.warn("[v0] All uploads failed, using compressed data URLs as fallback")
        setGeneratedImages(compressedImages)
        setCachedImages(compressedImages)
        setCurrentImageIndex(0)
        console.log("[v0] Using", compressedImages.length, "compressed data URLs as fallback")
      }
    } catch (err) {
      console.error("[v0] Lamatic error:", err)
      alert(`Failed to generate images: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? generatedImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === generatedImages.length - 1 ? 0 : prev + 1))
  }

  const goToImage = (index: number) => setCurrentImageIndex(index)

  const handleCreateByYourself = () => {
    const selectedImage =
      generatedImages.length > 0
        ? generatedImages[currentImageIndex]
        : isImageUrl
          ? image
          : processedImage
            ? `data:image/png;base64,${processedImage}`
            : null

    if (selectedImage) {
      setSelectedImage(selectedImage)
    }

    router.push("/create")
  }

  const handleShare = async () => {
    if (generatedImages.length === 0) return

    try {
      setIsSharing(true)
      const currentImage = generatedImages[currentImageIndex]

      if (
        currentImage.startsWith("https://files.catbox.moe/") ||
        (currentImage.startsWith("https://") && currentImage.includes("blob.vercel-storage.com"))
      ) {
        console.log("[v0] Image already hosted, using URL directly:", currentImage)
        setShareUrl(currentImage)
        setIsSharing(false)
        return
      }

      if (!currentImage.startsWith("data:image/")) {
        console.error("[v0] Invalid image format for sharing:", currentImage.substring(0, 50))
        throw new Error("Invalid image format")
      }

      console.log("[v0] Uploading base64 image to Catbox for sharing...")
      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Data: currentImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url: imageUrl } = await response.json()
      console.log("[v0] Share URL created:", imageUrl)

      setShareUrl(imageUrl)
    } catch (error) {
      console.error("[v0] Share error:", error)
      alert(
        `Failed to create share link: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
      )
    } finally {
      setIsSharing(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const closeShareModal = () => {
    setShareUrl(null)
    setCopied(false)
  }

  const handleBackToThemes = () => {
    clearCache()
    router.push("/themes")
  }

  const handleBackToHome = () => {
    clearCache()
    router.push("/")
  }

  const handleSelectImage = () => {
    const currentImage = generatedImages.length > 0 ? generatedImages[currentImageIndex] : null
    if (currentImage) {
      setSelectedImageForDesign(currentImage)
      setShowDesignButtons(true)
    }
  }

  const handleMake = async () => {
    if (!selectedImageForDesign) return

    try {
      setIsLoading(true)
      setLoadingMessage("Planning Steps...")
      setDesignMode("make")

      const result = await executeCostumeDesigner({
        image: selectedImageForDesign,
        page: "create",
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to get costume instructions")
      }

      console.log("[v0] Costume Designer result (Make):", result.data)
      setDesignResults(result.data)
    } catch (err) {
      console.error("[v0] Costume Designer error:", err)
      alert(`Failed to get costume instructions: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!selectedImageForDesign) return

    try {
      setIsLoading(true)
      setLoadingMessage("Finding Products...")
      setDesignMode("buy")

      const result = await executeCostumeDesigner({
        image: selectedImageForDesign,
        page: "buy",
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to get product recommendations")
      }

      console.log("[v0] Costume Designer result (Buy):", result.data)
      setDesignResults(result.data)
    } catch (err) {
      console.error("[v0] Costume Designer error:", err)
      alert(`Failed to get product recommendations: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToImages = () => {
    setSelectedImageForDesign(null)
    setShowDesignButtons(false)
    setDesignResults(null)
    setDesignMode(null)
  }

  useEffect(() => {
    if (generatedImages.length === 0) return

    console.log("[v0] Tracking preloaded images for carousel...")
    const loadPromises = generatedImages.map((url, index) => {
      return new Promise<number>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          resolve(index)
        }
        img.onerror = () => {
          reject(index)
        }
        img.src = url
      })
    })

    Promise.allSettled(loadPromises).then((results) => {
      const loaded = new Set<number>()
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          loaded.add(result.value)
        }
      })
      setPreloadedImages(loaded)
    })
  }, [generatedImages])

  useEffect(() => {
    setImageLoading(true)
    setImageError(false)
  }, [currentImageIndex])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-gray-800/20" />

      <main className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="space-y-8 max-w-4xl w-full">
          {designResults && designMode ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4">
                  {designMode === "make" ? (
                    <>
                      <span className="text-yellow-400">Make</span> Your Costume
                    </>
                  ) : (
                    <>
                      <span className="text-yellow-400">Buy</span> Your Costume
                    </>
                  )}
                </h2>
              </div>

              {designMode === "make" && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6">
                  {designResults.result?.answer ? (
                    <MarkdownRenderer content={designResults.result.answer} />
                  ) : (
                    <p className="text-white">No instructions available</p>
                  )}
                </div>
              )}

              {designMode === "buy" && (
                <div className="space-y-8">
                  {designResults.result?.answer && Array.isArray(designResults.result.answer) ? (
                    designResults.result.answer.map((group: any, groupIndex: number) => (
                      <div key={groupIndex} className="space-y-4">
                        {group.q && <h3 className="text-2xl font-bold text-orange-400 mb-4">{group.q}</h3>}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {group.items?.map((item: any, itemIndex: number) => (
                            <a
                              key={itemIndex}
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gray-800/70 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden hover:border-orange-500/50 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20"
                            >
                              <div className="relative h-48 bg-gray-900">
                                <img
                                  src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
                                  alt={item.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="p-4 space-y-2">
                                <h4 className="text-white font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                                  {item.title}
                                </h4>
                                <p className="text-gray-400 text-xs">{item.source}</p>
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-orange-400 font-bold text-lg">{item.price}</span>
                                  {item.rating && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-yellow-400 text-sm">⭐ {item.rating}</span>
                                      {item.ratingCount && (
                                        <span className="text-gray-400 text-xs">({item.ratingCount})</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button className="w-full mt-3 bg-purple-500/80 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200">
                                  View Product
                                </button>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white text-center">No products available</p>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleBackToImages}
                  className="bg-gray-600/90 hover:bg-gray-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-gray-500/30 flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Images
                </button>
                <button
                  onClick={handleBackToHome}
                  className="bg-orange-500/90 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-orange-400/30 flex items-center gap-2"
                  style={{ filter: "drop-shadow(0 0 20px rgba(255, 165, 0, 0.4))" }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isLoading && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                    {isViewingShared ? (
                      <>
                        <span className="text-yellow-400">Shared</span> Spookify Image
                      </>
                    ) : (
                      <>
                        You <span className="text-yellow-400">Transformed !</span>
                      </>
                    )}
                  </h2>
                  {isViewingShared && sharedTheme && <p className="text-gray-300 text-lg">Theme: {sharedTheme}</p>}
                </div>
              )}

              {generatedImages.length > 0 && (
                <div className="relative">
                  <div className="flex justify-center relative">
                    {imageLoading && !preloadedImages.has(currentImageIndex) && !imageError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                    {imageError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-red-400">Failed to load image</p>
                      </div>
                    )}
                    <img
                      src={generatedImages[currentImageIndex] || "/placeholder.svg"}
                      alt="Generated transformed image"
                      className={`w-full max-w-2xl h-auto rounded-lg transition-opacity duration-300 ${
                        imageLoading && !preloadedImages.has(currentImageIndex) ? "opacity-0" : "opacity-100"
                      }`}
                      style={{ filter: "drop-shadow(0 0 30px rgba(255, 165, 0, 0.5))" }}
                      crossOrigin="anonymous"
                      onLoad={() => {
                        console.log("[v0] Image", currentImageIndex + 1, "displayed successfully")
                        setImageLoading(false)
                        setImageError(false)
                      }}
                      onError={(e) => {
                        console.error("[v0] Image failed to display:", generatedImages[currentImageIndex])
                        setImageLoading(false)
                        setImageError(true)
                      }}
                    />
                  </div>

                  {generatedImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-orange-500/80 hover:bg-orange-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <button
                        onClick={handleNext}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-orange-500/80 hover:bg-orange-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      <div className="flex justify-center gap-2 mt-6">
                        {generatedImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              index === currentImageIndex ? "bg-orange-400 w-8" : "bg-gray-500 hover:bg-gray-400"
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {generatedImages.length > 0 && !isViewingShared && (
                <div className="flex justify-center">
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="bg-purple-500/90 hover:bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-purple-400/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))" }}
                  >
                    <Share2 className="w-5 h-5" />
                    {isSharing ? "Creating Share Link..." : "Share Image"}
                  </button>
                </div>
              )}

              {generatedImages.length > 0 && !showDesignButtons && (
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={handleSelectImage}
                    className="bg-purple-500/90 hover:bg-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-purple-400/30"
                    style={{ filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))" }}
                  >
                    Select Image
                  </button>
                  <button
                    onClick={handleBackToHome}
                    className="bg-orange-500/90 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-orange-400/30 flex items-center gap-2"
                    style={{ filter: "drop-shadow(0 0 20px rgba(255, 165, 0, 0.4))" }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back Home
                  </button>
                </div>
              )}

              {showDesignButtons && !designResults && (
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={handleMake}
                    className="bg-green-500/90 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-green-400/30 flex items-center gap-2"
                    style={{ filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.4))" }}
                  >
                    <Hammer className="w-5 h-5" />
                    Make
                  </button>
                  <button
                    onClick={handleBuy}
                    className="bg-blue-500/90 hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-blue-400/30 flex items-center gap-2"
                    style={{ filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))" }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Buy
                  </button>
                  <button
                    onClick={handleBackToHome}
                    className="bg-orange-500/90 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-orange-400/30 flex items-center gap-2"
                    style={{ filter: "drop-shadow(0 0 20px rgba(255, 165, 0, 0.4))" }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back Home
                  </button>
                </div>
              )}

              {image && !isLoading && generatedImages.length === 0 && (
                <div className="flex justify-center">
                  <img
                    src={isImageUrl ? image : `data:image/png;base64,${processedImage}`}
                    alt="Uploaded Image"
                    className="w-full max-w-md h-auto"
                    style={{ filter: "drop-shadow(0 0 30px rgba(255, 165, 0, 0.5))" }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-orange-500/50 rounded-lg p-6 max-w-md w-full space-y-4 relative">
            <button
              onClick={closeShareModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-4">Share Your Costume</h3>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 break-all text-sm text-gray-300">
              {shareUrl}
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </button>

            <p className="text-gray-400 text-sm text-center">Share this link with anyone to show off your costume!</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <p className="text-white text-2xl font-semibold mb-6">
            {isViewingShared ? "Loading shared image..." : loadingMessage}
          </p>
          <Spinner />
        </div>
      )}
    </div>
  )
}
