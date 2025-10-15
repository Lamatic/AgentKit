export default function ImagesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center">
      {/* Animated ghost icons */}
      <div className="flex gap-4 mb-8">
        <div className="text-5xl animate-bounce" style={{ animationDelay: "0ms" }}>
          👻
        </div>
        <div className="text-5xl animate-bounce" style={{ animationDelay: "150ms" }}>
          🎃
        </div>
        <div className="text-5xl animate-bounce" style={{ animationDelay: "300ms" }}>
          👻
        </div>
      </div>

      {/* Loading text */}
      <p className="text-2xl text-orange-400 font-serif font-bold animate-pulse">Conjuring your costumes...</p>

      {/* Spinning loader */}
      <div className="mt-6">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent shadow-lg shadow-purple-500/50" />
      </div>
    </div>
  )
}
