"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface ImageCellProps {
  imageUrl: string
}

export function ImageCell({ imageUrl }: ImageCellProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [processedImageUrl, setProcessedImageUrl] = useState<string>("")

  useEffect(() => {
    if (!imageUrl) {
      setProcessedImageUrl("")
      return
    }

    // Check if it's a base64 string
    if (imageUrl.startsWith("data:image/") || !imageUrl.startsWith("http")) {
      try {
        // If it's already a data URL, use it directly
        if (imageUrl.startsWith("data:image/")) {
          setProcessedImageUrl(imageUrl)
        } else {
          // If it's raw base64, add the data URL prefix
          // Assume PNG format, but this could be made more flexible
          const dataUrl = imageUrl.startsWith("data:") ? imageUrl : `data:image/png;base64,${imageUrl}`
          setProcessedImageUrl(dataUrl)
        }
      } catch (error) {
        console.error("[v0] Error processing base64 image:", error)
        setImageError(true)
      }
    } else {
      // It's a regular URL
      setProcessedImageUrl(imageUrl)
    }

    // Cleanup function to revoke blob URLs if we created any
    return () => {
      if (processedImageUrl && processedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(processedImageUrl)
      }
    }
  }, [imageUrl])

  const handleDownload = () => {
    if (!processedImageUrl) return

    const link = document.createElement("a")
    link.href = processedImageUrl
    link.download = `ai-generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (imageError) {
    return <div className="min-h-[32px] rounded px-2 py-1 text-sm text-muted-foreground">Failed to load image</div>
  }

  if (!processedImageUrl) {
    return <div className="min-h-[32px] rounded px-2 py-1 text-sm text-muted-foreground">Loading image...</div>
  }

  return (
    <>
      <div onClick={() => setShowOverlay(true)} className="cursor-pointer p-1 hover:bg-muted/50 rounded">
        <img
          src={processedImageUrl || "/placeholder.svg"}
          alt="AI generated"
          className="max-h-[80px] max-w-full object-contain rounded"
          onError={() => setImageError(true)}
        />
      </div>

      <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black/95 p-8">
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={handleDownload}
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="h-5 w-5 text-white" />
              </Button>
              <Button
                onClick={() => setShowOverlay(false)}
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            <img
              src={processedImageUrl || "/placeholder.svg"}
              alt="AI generated (full size)"
              className="max-w-full max-h-full object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
