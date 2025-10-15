"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef } from "react"

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const pumpkinRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pumpkinRef.current) return

    const rect = pumpkinRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const x = (e.clientX - centerX) / (rect.width / 2)
    const y = (e.clientY - centerY) / (rect.height / 2)

    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-gray-800/20" />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                Transform Yourself for <span className="text-yellow-400">Halloween!</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
                Drop your pic, pick a theme, and boom you in 3 epic costumes. From spooky to silly, see your Halloween
                look like never before!
              </p>
            </div>

            <div className="pt-4">
              <Link href="/upload">
                <button className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-lg rounded-lg shadow-lg hover:from-orange-500 hover:to-red-500 hover:shadow-xl hover:scale-105 transition-all duration-300 border border-orange-400/50">
                  Transform Yourself
                </button>
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              ref={pumpkinRef}
              className="relative w-full max-w-md perspective-1000"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ perspective: "1000px" }}
            >
              <img
                src="/images/halloween-pumpkin.png"
                alt="Halloween Jack-o'-lantern with witch hat"
                className="w-full h-auto transition-all duration-300 ease-out"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(255, 165, 0, 0.5))",
                  transform: `
                    rotateY(${mousePosition.x * 15}deg) 
                    rotateX(${-mousePosition.y * 15}deg) 
                    translateZ(${Math.abs(mousePosition.x) + Math.abs(mousePosition.y) > 0 ? "20px" : "0px"})
                    scale(${1 + (Math.abs(mousePosition.x) + Math.abs(mousePosition.y)) * 0.05})
                  `,
                  transformStyle: "preserve-3d",
                }}
              />
              <div
                className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl transition-all duration-300"
                style={{
                  transform: `
                    rotateY(${mousePosition.x * 10}deg) 
                    rotateX(${-mousePosition.y * 10}deg) 
                    translateZ(-10px)
                    scale(${0.8 + (Math.abs(mousePosition.x) + Math.abs(mousePosition.y)) * 0.1})
                  `,
                  opacity: Math.abs(mousePosition.x) + Math.abs(mousePosition.y) > 0 ? 0.6 : 0.3,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
