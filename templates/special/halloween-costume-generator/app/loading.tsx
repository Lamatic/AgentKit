export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center">
      {/* Animated pumpkin icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse shadow-lg shadow-orange-500/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-bounce">🎃</div>
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-8 text-xl text-orange-400 font-serif font-bold animate-pulse">
        Loading your spooky experience...
      </p>

      {/* Spinning loader */}
      <div className="mt-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-400 border-r-transparent" />
      </div>
    </div>
  )
}
