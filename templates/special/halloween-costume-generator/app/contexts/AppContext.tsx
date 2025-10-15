"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface AppContextType {
  image: string | null
  theme: string | null
  generatedImages: string[]
  selectedImage: string | null
  setImage: (image: string | null) => void
  setTheme: (theme: string | null) => void
  setGeneratedImages: (images: string[]) => void
  setSelectedImage: (image: string | null) => void
  clearCache: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [image, setImage] = useState<string | null>(null)
  const [theme, setTheme] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const clearCache = () => {
    setImage(null)
    setTheme(null)
    setGeneratedImages([])
    setSelectedImage(null)
  }

  return (
    <AppContext.Provider
      value={{
        image,
        theme,
        generatedImages,
        selectedImage,
        setImage,
        setTheme,
        setGeneratedImages,
        setSelectedImage,
        clearCache,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
