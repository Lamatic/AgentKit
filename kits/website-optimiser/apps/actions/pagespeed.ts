'use server';

export interface PageSpeedData {
  performanceScore: number;
  fcp: string;
  lcp: string;
  cls: string;
  tbt: string;
  speedIndex: string;
  error?: string;
}

export async function getPageSpeedData(url: string): Promise<PageSpeedData> {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    const res = await fetch(apiUrl, { 
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      return { performanceScore: 0, fcp: 'N/A', lcp: 'N/A', cls: 'N/A', tbt: 'N/A', speedIndex: 'N/A', error: 'PageSpeed API unavailable' };
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories;
    const audits = data.lighthouseResult?.audits;

    const fmt = (key: string) => {
      const v = audits?.[key]?.displayValue;
      return v ?? 'N/A';
    };

    return {
      performanceScore: Math.round((cats?.performance?.score ?? 0) * 100),
      fcp: fmt('first-contentful-paint'),
      lcp: fmt('largest-contentful-paint'),
      cls: fmt('cumulative-layout-shift'),
      tbt: fmt('total-blocking-time'),
      speedIndex: fmt('speed-index'),
    };
  } catch {
    return {
      performanceScore: 0,
      fcp: 'N/A', lcp: 'N/A', cls: 'N/A', tbt: 'N/A', speedIndex: 'N/A',
      error: 'Could not reach PageSpeed API'
    };
  }
}
