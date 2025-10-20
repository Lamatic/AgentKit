"use server"

import { put } from "@vercel/blob"

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

export async function uploadBase64ToBlob(base64Data: string, filename: string) {
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

    // Detect image type from data URL
    const imageTypeMatch = base64Data.match(/^data:image\/(\w+);base64,/)
    const imageType = imageTypeMatch ? imageTypeMatch[1] : "png"
    const contentType = `image/${imageType}`

    const estimatedSize = (base64String.length * 3) / 4
    console.log(`[v0] Uploading image ${filename}, estimated size: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB`)

    // Convert base64 to Uint8Array
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create a Blob from the Uint8Array
    const blob = new Blob([bytes], { type: contentType })

    const uploadedBlob = await retryWithBackoff(
      () =>
        put(filename, blob, {
          access: "public",
          contentType,
        }),
      3,
      1000,
    )

    console.log(`[v0] Successfully uploaded ${filename} to ${uploadedBlob.url}`)
    return { success: true, url: uploadedBlob.url }
  } catch (error) {
    console.error(`[v0] Error uploading ${filename} to blob:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

export async function uploadMultipleImagesToBlob(images: string[]) {
  try {
    console.log(`[v0] Starting upload of ${images.length} images to Blob...`)

    const uploadPromises = images.map((image, index) => {
      const filename = `halloween-costume-${Date.now()}-${index}.png`
      return uploadBase64ToBlob(image, filename)
    })

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

    console.log(`[v0] Successfully uploaded ${successfulUploads.length} out of ${images.length} images`)
    return { success: true, urls: successfulUploads }
  } catch (error) {
    console.error("[v0] Error uploading multiple images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload images",
    }
  }
}
