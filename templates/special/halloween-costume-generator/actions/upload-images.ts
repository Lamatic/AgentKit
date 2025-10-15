"use server"

import { put } from "@vercel/blob"

export async function uploadBase64ToBlob(base64Data: string, filename: string) {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, "")

    // Detect image type from data URL
    const imageTypeMatch = base64Data.match(/^data:image\/(\w+);base64,/)
    const imageType = imageTypeMatch ? imageTypeMatch[1] : "png"
    const contentType = `image/${imageType}`

    // Convert base64 to Uint8Array
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create a Blob from the Uint8Array
    const blob = new Blob([bytes], { type: contentType })

    // Upload to Vercel Blob
    const uploadedBlob = await put(filename, blob, {
      access: "public",
      contentType,
    })

    return { success: true, url: uploadedBlob.url }
  } catch (error) {
    console.error("Error uploading to blob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

export async function uploadMultipleImagesToBlob(images: string[]) {
  try {
    const uploadPromises = images.map((image, index) => {
      const filename = `halloween-costume-${Date.now()}-${index}.png`
      return uploadBase64ToBlob(image, filename)
    })

    const results = await Promise.all(uploadPromises)

    const urls = results.filter((result) => result.success).map((result) => result.url!)

    return { success: true, urls }
  } catch (error) {
    console.error("Error uploading multiple images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload images",
    }
  }
}
