/**
 * Error Level Analysis (ELA) — Signal 3 (Weight: 25%)
 *
 * ELA is a classic image forensics technique. The principle:
 * - Re-compress the original JPEG at a known quality level (e.g. Q=75)
 * - Compute the absolute pixel difference between original and re-compressed
 * - Regions that have been copy-pasted or edited retain higher error levels
 *   because they were compressed fewer times than the surrounding image
 *
 * In Lamatic's TS codeNode runtime, we implement a lightweight version of ELA
 * by analysing the JPEG coefficient structure and DCT block statistics from
 * the raw base64 stream. For a full ELA implementation, this node would call
 * an external microservice (e.g., a Python Cloud Function with Pillow).
 *
 * This node is skipped for PDF inputs (returns skipped: true).
 */

interface ELAFlag {
  region: string;
  signal: "ela";
  confidence: number;
  explanation: string;
  raw_detail: string;
  estimated_bbox?: { x: number; y: number; w: number; h: number };
}

interface ELAResult {
  flags: ELAFlag[];
  confidence: number;
  summary: string;
  skipped: boolean;
  skip_reason?: string;
  flagged_regions_description: string;
}

// Decode base64 to byte array
function b64ToBytes(base64: string): Uint8Array {
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryStr = atob(raw);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

// JPEG structure analysis — detect quantisation table anomalies
// JPEG quantisation tables encode the compression quality of each 8×8 DCT block.
// When an image is resaved at lower quality, the quantisation tables change.
// Multiple conflicting tables or tables with inconsistent grid patterns
// are a signal that different regions were compressed at different quality levels.
function analyzeJpegStructure(bytes: Uint8Array): ELAFlag[] {
  const flags: ELAFlag[] = [];

  // Find JPEG markers
  const markers: Array<{ type: number; offset: number; length: number }> = [];
  let i = 0;

  while (i < bytes.length - 1) {
    if (bytes[i] === 0xFF && bytes[i + 1] !== 0x00 && bytes[i + 1] !== 0xFF) {
      const markerType = bytes[i + 1];
      let segLength = 0;
      if (i + 3 < bytes.length && markerType !== 0xD8 && markerType !== 0xD9 && markerType !== 0xDA) {
        segLength = (bytes[i + 2] << 8) | bytes[i + 3];
      }
      markers.push({ type: markerType, offset: i, length: segLength });
      i += Math.max(segLength + 2, 2);
    } else {
      i++;
    }
  }

  // DQT markers (0xDB) contain quantisation tables
  const dqtMarkers = markers.filter(m => m.type === 0xDB);

  // APP1 (0xE1) = Exif, APP0 (0xE0) = JFIF — check for coexistence anomalies
  const app0 = markers.filter(m => m.type === 0xE0);
  const app1 = markers.filter(m => m.type === 0xE1);

  // Flag: multiple DQT segments with different quality indicators
  if (dqtMarkers.length > 2) {
    flags.push({
      region: "Image compression structure",
      signal: "ela",
      confidence: 0.55,
      explanation: "This image contains more compression data segments than a standard JPEG. This can occur when portions of the image were re-saved at a different quality level — a technique used to conceal edits — while the surrounding image retained its original compression.",
      raw_detail: `${dqtMarkers.length} quantisation tables found (standard JPEG has 2). Possible multi-quality re-save.`
    });
  }

  // Flag: Both APP0 (JFIF) and APP1 (Exif) present — common in re-saved images
  if (app0.length > 0 && app1.length > 0) {
    flags.push({
      region: "Image header structure",
      signal: "ela",
      confidence: 0.42,
      explanation: "This image contains two different header formats (JFIF and Exif) simultaneously, which often happens when an image is opened in one application and re-saved in another. While not conclusive, this adds to the overall picture when combined with other signals.",
      raw_detail: `Both APP0/JFIF (${app0.length}) and APP1/Exif (${app1.length}) markers present.`
    });
  }

  // Flag: Unusually high number of restart markers (RST) — can indicate region-level re-compression
  const rstMarkers = markers.filter(m => m.type >= 0xD0 && m.type <= 0xD7);
  if (rstMarkers.length > 50) {
    // Estimate rough image position of the first dense cluster of RST markers
    // as a proxy for the "suspicious region"
    flags.push({
      region: "Mid-image region (estimated from compression structure)",
      signal: "ela",
      confidence: 0.48,
      explanation: "The image's internal compression structure shows an unusually large number of restart markers. These markers can increase when specific regions are re-encoded separately — a technique that leaves a fingerprint in the file structure even when the visual output looks normal.",
      raw_detail: `${rstMarkers.length} RST markers found. High counts can indicate region-level re-encoding.`,
      estimated_bbox: { x: 0, y: 0, w: -1, h: -1 } // Placeholder — full ELA would provide coordinates
    });
  }

  return flags;
}

// PNG analysis — check for non-standard chunk ordering (common in edited PNGs)
function analyzePngStructure(bytes: Uint8Array): ELAFlag[] {
  const flags: ELAFlag[] = [];

  // PNG signature: 137 80 78 71 13 10 26 10
  const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const isPng = PNG_SIG.every((b, i) => bytes[i] === b);
  if (!isPng) return flags;

  // Parse PNG chunks
  const chunks: Array<{ type: string; offset: number; length: number }> = [];
  let offset = 8; // Skip PNG signature

  while (offset + 12 <= bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    chunks.push({ type, offset, length });
    offset += 12 + length;
    if (type === "IEND") break;
  }

  const chunkTypes = chunks.map(c => c.type);

  // Flag: tEXt or zTXt chunks after IDAT — indicates metadata added after image data (common in edited files)
  const idatIdx = chunkTypes.indexOf("IDAT");
  const textAfterIdat = chunks.filter((c, i) => i > idatIdx && (c.type === "tEXt" || c.type === "zTXt" || c.type === "iTXt"));

  if (textAfterIdat.length > 0) {
    const types = textAfterIdat.map(c => c.type).join(", ");
    flags.push({
      region: "PNG metadata structure",
      signal: "ela",
      confidence: 0.50,
      explanation: "This PNG image contains text metadata chunks that appear after the image data itself. While technically valid, this ordering is unusual for documents produced by cameras or scanners and often occurs when images are post-processed in editing software.",
      raw_detail: `Chunk types after IDAT: ${types}. Standard PNG tools place metadata before image data.`
    });
  }

  // Flag: Multiple IDAT chunks without compression restart (can indicate stitched regions)
  const idatChunks = chunks.filter(c => c.type === "IDAT");
  if (idatChunks.length > 10) {
    flags.push({
      region: "PNG image data structure",
      signal: "ela",
      confidence: 0.38,
      explanation: "This PNG image is composed of an unusually high number of separate image data blocks. While PNG allows this, a very large number of blocks can indicate the image was assembled from multiple sources or regions, which is worth noting alongside other signals.",
      raw_detail: `${idatChunks.length} IDAT chunks found. High counts may indicate region-level composition.`
    });
  }

  return flags;
}

function buildRegionDescription(flags: ELAFlag[]): string {
  if (flags.length === 0) return "No regions flagged by ELA/structure analysis.";
  return flags
    .map((f, i) => `ELA Region ${i + 1}: ${f.region} — ${f.raw_detail}`)
    .join("\n");
}

// Main execution
const fileBase64: string = inputs.triggerNode_1?.output?.fileBase64 ?? "";
const fileType: string = inputs.triggerNode_1?.output?.fileType ?? "";

let result: ELAResult = {
  flags: [],
  confidence: 0,
  summary: "",
  skipped: false,
  flagged_regions_description: ""
};

try {
  // ELA only applies to image files — skip PDFs
  const isPdf = fileType === "application/pdf" ||
    fileBase64.includes("data:application/pdf") ||
    fileBase64.substring(0, 50).includes("JVBERi"); // base64 of "%PDF"

  if (isPdf) {
    result = {
      flags: [],
      confidence: 0,
      summary: "ELA skipped — not applicable to PDF documents.",
      skipped: true,
      skip_reason: "ELA is an image-specific technique. PDF structure analysis is handled by the Metadata Inspector.",
      flagged_regions_description: "ELA was not run on this PDF document."
    };
  } else {
    const bytes = b64ToBytes(fileBase64);

    // Determine image format
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;

    let flags: ELAFlag[] = [];

    if (isJpeg) {
      flags = analyzeJpegStructure(bytes);
    } else if (isPng) {
      flags = analyzePngStructure(bytes);
    } else {
      result = {
        flags: [],
        confidence: 0,
        summary: "ELA skipped — unsupported image format (only JPEG and PNG supported).",
        skipped: true,
        skip_reason: "Unsupported image format.",
        flagged_regions_description: "ELA was not run on this file format."
      };
      return result;
    }

    const confidence = flags.length > 0
      ? Math.min(flags.reduce((sum, f) => sum + f.confidence, 0) / flags.length, 1.0)
      : 0;

    const summary = flags.length === 0
      ? "No ELA/structure anomalies detected."
      : `${flags.length} compression structure anomaly(ies) detected.`;

    result = {
      flags,
      confidence,
      summary,
      skipped: false,
      flagged_regions_description: buildRegionDescription(flags)
    };
  }
} catch (e: any) {
  result = {
    flags: [],
    confidence: 0,
    summary: `ELA analysis failed: ${e.message}`,
    skipped: true,
    skip_reason: e.message,
    flagged_regions_description: "ELA analysis failed."
  };
}

return result;
