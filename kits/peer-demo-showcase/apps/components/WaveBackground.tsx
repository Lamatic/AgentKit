'use client';

export default function WaveBackground() {
  return (
    <div className="absolute inset-0 w-full h-[650px] overflow-hidden pointer-events-none select-none -z-20">
      {/* Wave SVG track wrapper */}
      <div className="absolute inset-0 w-full h-full opacity-[0.14] dark:opacity-[0.08]">
        <svg
          className="absolute left-0 w-[200%] h-full min-w-[2000px] translate-y-[15%] lg:translate-y-[5%]"
          viewBox="0 0 1440 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wave 1 */}
          <path
            className="animate-wave-slow"
            d="M0,320 C320,380 640,260 960,300 C1280,340 1600,440 1920,400 L1920,1000 L0,1000 Z"
            fill="url(#wave-grad-1)"
          />
          {/* Wave 2 */}
          <path
            className="animate-wave-medium"
            d="M0,450 C400,380 800,480 1200,410 C1600,340 2000,430 2400,380 L2400,1000 L0,1000 Z"
            fill="url(#wave-grad-2)"
          />
          {/* Wave 3 */}
          <path
            className="animate-wave-fast"
            d="M0,580 C360,640 720,520 1080,560 C1440,600 1800,680 2160,640 L2160,1000 L0,1000 Z"
            fill="url(#wave-grad-3)"
          />

          <defs>
            <linearGradient id="wave-grad-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="wave-grad-3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
