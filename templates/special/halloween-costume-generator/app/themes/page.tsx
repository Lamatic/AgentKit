"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "../contexts/AppContext"
import { Skull, Laugh, Heart, Sparkles, Film, Moon, Ghost, Flame } from "lucide-react"

export default function ThemesPage() {
  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const { setTheme } = useApp()
  const router = useRouter()

  const themes = [
    { id: "scary", name: "Scary", description: "Terrifying horror characters", icon: Skull },
    { id: "funny", name: "Funny", description: "Hilarious and comedic looks", icon: Laugh },
    { id: "cute", name: "Cute", description: "Adorable Halloween looks", icon: Heart },
    { id: "fantasy", name: "Fantasy", description: "Magical creatures & beings", icon: Sparkles },
    { id: "pop-culture", name: "Pop Culture", description: "Trending characters & memes", icon: Film },
    { id: "gothic", name: "Gothic", description: "Dark romantic aesthetics", icon: Moon },
    { id: "classic-monsters", name: "Classic Monsters", description: "Traditional movie monsters", icon: Ghost },
    { id: "sexy", name: "Sexy", description: "Alluring & seductive styles", icon: Flame },
  ]

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId) // Save globally
  }

  const handleGenerate = () => {
    router.push("/images")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-gray-800/20" />
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/upload" className="inline-block mb-6 text-orange-400 hover:text-orange-300 transition-colors">
            ← Back to Upload
          </Link>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Choose Your <span className="text-yellow-400">Theme</span>
          </h1>
          <p className="text-gray-300 text-lg">Pick a style and we'll generate 9 amazing costume variations</p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
            {themes.map((theme) => {
              const IconComponent = theme.icon
              return (
                <div
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`group relative p-6 lg:p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedTheme === theme.id
                      ? "border-orange-400 bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/25"
                      : "border-gray-600/50 bg-gray-900/40 hover:border-orange-500/70 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="text-center space-y-3 lg:space-y-4">
                    <div className="flex justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent size={48} className="text-orange-400 group-hover:text-orange-300" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-white">{theme.name}</h3>
                    <p className="text-gray-400 text-xs lg:text-sm leading-relaxed">{theme.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedTheme && (
            <div className="text-center">
              <button
                className="px-12 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-orange-400/50"
                onClick={handleGenerate}
              >
                Generate Costumes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
