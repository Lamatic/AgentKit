"use server"

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

function isValidBase64(str: string): boolean {
  try {
    // Remove data URL prefix if present
    const base64String = str.replace(/^data:image\/\w+;base64,/, "")
    // Check if it's valid base64
    return btoa(atob(base64String)) === base64String
  } catch {
    return false
  }
}

export async function uploadBase64ToCatbox(base64Data: string) {
  try {
    if (!isValidBase64(base64Data)) {
      console.error("[v0] Invalid base64 string detected")
      return {
        success: false,
        error: "Invalid base64 image data",
      }
    }

    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "")

    const estimatedSize = (base64String.length * 3) / 4
    console.log(`[v0] Uploading image to Catbox, estimated size: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`)

    const uploadedUrl = await retryWithBackoff(
      async () => {
        const response = await fetch("/api/upload-to-catbox", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Data }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const { url } = await response.json()
        return url
      },
      3,
      1000,
    )

    console.log(`[v0] Successfully uploaded to Catbox: ${uploadedUrl}`)
    return { success: true, url: uploadedUrl }
  } catch (error) {
    console.error(`[v0] Error uploading to Catbox:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

export async function uploadMultipleImagesToBlob(images: string[]) {
  try {
    console.log(`[v0] Starting upload of ${images.length} images to Catbox...`)

    const uploadPromises = images.map((image) => uploadBase64ToCatbox(image))

    const results = await Promise.allSettled(uploadPromises)

    const successfulUploads = results
      .filter(
        (result): result is PromiseFulfilledResult<{ success: boolean; url?: string; error?: string }> =>
          result.status === "fulfilled" && result.value.success,
      )
      .map((result) => result.value.url!)

    const failedCount = results.length - successfulUploads.length

    if (failedCount > 0) {
      console.warn(`[v0] ${failedCount} out of ${images.length} images failed to upload`)
    }

    if (successfulUploads.length === 0) {
      return {
        success: false,
        error: "All image uploads failed. Please try again.",
      }
    }

    console.log(`[v0] Successfully uploaded ${successfulUploads.length} out of ${images.length} images to Catbox`)
    return { success: true, urls: successfulUploads }
  } catch (error) {
    console.error("[v0] Error uploading multiple images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload images",
    }
  }
}
