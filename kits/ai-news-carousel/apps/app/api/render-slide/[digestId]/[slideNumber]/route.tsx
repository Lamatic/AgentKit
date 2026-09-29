import { ImageResponse } from '@vercel/og';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
});

/**
 * Renders a single carousel slide as a PNG image on the fly, using the
 * stored digest data. Slide 0 uses a full-bleed cover layout; all other
 * slides use a top-text/bottom-image layout.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ digestId: string; slideNumber: string }> }
) {
  const { digestId, slideNumber } = await params;
  const raw = await redis.get<string>(`digest:${digestId}`);
  if (!raw) return new Response('Not found', { status: 404 });
  const digest = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const slide = digest.slides.find((s: any) => s.slideNumber === Number(slideNumber));
  if (!slide) return new Response('Slide not found', { status: 404 });

  const isCover = slide.slideNumber === 0;

  if (isCover) {
    return new ImageResponse(
  (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' }}>
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          width={1080}
        height={1350}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e, #16162a)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.4))' }} />
      <div style={{ position: 'absolute', bottom: 60, left: 50, right: 50, display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            fontSize: 128,
            fontWeight: 900,
            textTransform: 'uppercase',
            textAlign: 'center',
            letterSpacing: 4,
            color: '#FFFFFF',
            WebkitTextStroke: '3px #00D2FF',
            textShadow: '-2px -2px 0 #0066FF, 2px -2px 0 #0066FF, -2px 2px 0 #0066FF, 2px 2px 0 #0066FF, 0 0 10px #00D2FF, 0 0 20px #0066FF, 0 0 40px #0044CC, 0 0 80px #0011aa',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {slide.headline}
        </p>
        {slide.body && (
          <p style={{ fontSize: 28, color: '#D8D8D8', marginTop: 14, lineHeight: 1.4 }}>
            {slide.body}
          </p>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 24, right: 30, display: 'flex', width: 14, height: 14, borderRadius: 999, backgroundColor: '#7C5CFF' }} />
    </div>
  ),
  { width: 1080, height: 1350 }
);
  }

  return new ImageResponse(
    (

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#000000' }}>
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      gap: 20,
      height: '46%',
      padding: '30px',
      boxSizing: 'border-box',
    }}
  >
    <p
      style={{
        fontSize: 74,
        fontWeight: 900,
        color: '#FFFFFF',
        lineHeight: 1.08,
        letterSpacing: '-1.5px',
        textTransform: 'uppercase',
        margin: 0,
      }}
    >
      {slide.headline}
    </p>
    {slide.body && (
      <p
        style={{
          fontSize: 40,
          fontWeight: 500,
          color: '#C9C9D6',
          lineHeight: 1.35,
          letterSpacing: '-0.3px',
          margin: 0,
        }}
      >
        {slide.body}
      </p>
    )}
  </div>

  <div style={{ display: 'flex', height: '54%', position: 'relative' }}>
    {slide.imageUrl ? (
      <img
        src={slide.imageUrl}
        width={1080}
        height={1350}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16162a)' }} />
    )}
    <div style={{ position: 'absolute', bottom: 20, right: 30, display: 'flex', width: 14, height: 14, borderRadius: 999, backgroundColor: '#7C5CFF' }} />
  </div>
</div> 
    ),
    { width: 1080, height: 1350 }
  );
}
