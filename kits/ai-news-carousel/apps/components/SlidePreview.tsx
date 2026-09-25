
import type { SlideAsset } from '../actions/orchestrate';

/**
 * Displays thumbnail previews of a digest's 6 rendered slides, with a
 * single button to download all of them as a zip.
 */
export function SlidePreview({ digestId, slides }: { digestId: string; slides: SlideAsset[] }) {
  return (
    <div>
      <div className="flex gap-5 overflow-x-auto pb-3 -mx-1 px-1">
        {slides.map((slide) => (
          <div key={slide.slideNumber} className="shrink-0 flex flex-col gap-2.5">
            <div className="relative w-[min(38vw,320px)] md:w-[min(32vw,360px)] aspect-[4/5] overflow-hidden rounded-[22px] border border-white/10 bg-surfaceHigh shadow-[0_20px_40px_-18px_rgba(124,92,255,0.8)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-18px_rgba(124,92,255,0.9)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/render-slide/${digestId}/${slide.slideNumber}`}
                alt={slide.headline}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent" />
              <span className="absolute top-2 left-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accentDim backdrop-blur-sm">
                {slide.role.replace('_', ' ')}
              </span>
            </div>
            <a
              href={`/api/render-slide/${digestId}/${slide.slideNumber}`}
              download={`slide-${slide.slideNumber}-${slide.role}.png`}
              className="inline-flex items-center justify-center rounded-full border border-border bg-white/5 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
