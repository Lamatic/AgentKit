import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Icon colors use hard-coded hex values as an ImageResponse rendering exemption.
 * ImageResponse generates static PNGs at build/edge time and cannot resolve CSS
 * variables or runtime theme tokens. These values match the default light theme:
 * - PRIMARY: oklch(0.42 0.06 165) → #2f5c4f
 * - background: oklch(0.98 0.008 165) → #f4f7f5
 * For dark mode support, consumers should override via next.config.js routes.
 */
const PRIMARY = "#2f5c4f";
const BACKGROUND = "#f4f7f5";

/**
 * Browser tab / app icon — same Lucide BookOpen silhouette as the Point Proven header.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          borderRadius: 6,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
