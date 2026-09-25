/**
 * Metadata Inspector — Signal 1 (Weight: 30%)
 *
 * Extracts and analyses document metadata from the base64-encoded payload.
 * For PDFs: inspects the PDF Info dictionary for creation date, modification date,
 * producer, creator software, and flags suspicious mismatches.
 * For images: inspects EXIF-equivalent header markers and flags missing/stripped metadata.
 *
 * This runs purely on the raw bytes of the document — no external API calls.
 */

interface MetadataFlag {
  region: string;
  signal: "metadata";
  confidence: number;
  explanation: string;
  raw_detail: string;
}

interface MetadataResult {
  flags: MetadataFlag[];
  confidence: number;
  summary: string;
  metadata_extracted: Record<string, string>;
}

/**
 * Strips any data-URL prefix and decodes a base64 string to a Uint8Array
 * so that header bytes can be inspected directly.
 */
function decodeBase64ToBytes(base64: string): Uint8Array {
  // Strip data URL prefix if present (e.g. "data:application/pdf;base64,")
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryStr = atob(raw);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Returns the substring between `start` and `end` in `text`, or null if either
 * delimiter is absent. Used for lightweight PDF Info-dict field extraction.
 */
function extractBetween(text: string, start: string, end: string): string | null {
  const si = text.indexOf(start);
  if (si === -1) return null;
  const ei = text.indexOf(end, si + start.length);
  if (ei === -1) return null;
  return text.substring(si + start.length, ei).trim();
}

/**
 * Parses a PDF date string in the format `D:YYYYMMDDHHmmss` into a JS Date,
 * returning null for unrecognised formats.
 */
function parsePdfDate(dateStr: string): Date | null {
  const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return null;
  const [, year, month, day, hour = "00", min = "00", sec = "00"] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
}

// Known image-editing software keywords that are suspicious in "scanned" documents
const EDITING_SOFTWARE_KEYWORDS = [
  "photoshop", "gimp", "inkscape", "illustrator", "affinity", "paint.net",
  "pixelmator", "canva", "snapseed", "lightroom", "capture one"
];

// Known legitimate scanner/document software
const SCANNER_SOFTWARE_KEYWORDS = [
  "scansnap", "adobe acrobat", "foxit", "microsoft print to pdf",
  "cutepdf", "bullzip", "docuscan", "scanpapyrus", "camscanner", "scanbot"
];

/**
 * Inspects a PDF's /Info dictionary for metadata anomalies: missing metadata,
 * suspicious modification-vs-creation date gaps, image-editing software in
 * Producer/Creator fields, and scanner+editor software mismatches.
 */
function inspectPdfMetadata(rawText: string): { flags: MetadataFlag[]; metadata: Record<string, string> } {
  const flags: MetadataFlag[] = [];
  const metadata: Record<string, string> = {};

  // 1. Resolve /Info dictionary (handles direct dictionary as well as indirect references: /Info 12 0 R)
  let infoBlock = "";
  const indirectInfoMatch = rawText.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  const hasIndirectInfo = Boolean(indirectInfoMatch);
  const hasObjectStreams = rawText.includes("/ObjStm");
  const hasMetadataStream = rawText.includes("/Metadata");

  if (indirectInfoMatch) {
    const objNum = indirectInfoMatch[1];
    const genNum = indirectInfoMatch[2];
    // Look for "<obj> <gen> obj ... endobj"
    const objRegex = new RegExp(`${objNum}\\s+${genNum}\\s+obj[\\s\\S]*?<<([\\s\\S]*?)>>`, "m");
    const objMatch = rawText.match(objRegex);
    if (objMatch) {
      infoBlock = objMatch[1];
    }
  }

  if (!infoBlock) {
    // Try inline direct dictionary if present: /Info << ... >>
    infoBlock = extractBetween(rawText, "/Info", ">>") ?? "";
  }

  // Extract common fields
  const fields: Array<[string, string]> = [
    ["CreationDate", "/CreationDate"],
    ["ModDate", "/ModDate"],
    ["Creator", "/Creator"],
    ["Producer", "/Producer"],
    ["Author", "/Author"],
    ["Title", "/Title"],
  ];

  for (const [key, marker] of fields) {
    const val = extractBetween(infoBlock, marker + " (", ")") ??
                extractBetween(infoBlock, marker + "(", ")");
    if (val) metadata[key] = val;
  }

  // Also check XMP metadata stream if available in text (e.g. <xmp:CreatorTool>, <xmp:ModifyDate>)
  if (!metadata.Creator) {
    const creatorMatch = rawText.match(/<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/i) ??
                         rawText.match(/<pdf:CreatorTool>([^<]+)<\/pdf:CreatorTool>/i);
    if (creatorMatch) metadata.Creator = creatorMatch[1].trim();
  }
  if (!metadata.Producer) {
    const producerMatch = rawText.match(/<pdf:Producer>([^<]+)<\/pdf:Producer>/i);
    if (producerMatch) metadata.Producer = producerMatch[1].trim();
  }
  if (!metadata.CreationDate) {
    const createDateMatch = rawText.match(/<xmp:CreateDate>([^<]+)<\/xmp:CreateDate>/i);
    if (createDateMatch) metadata.CreationDate = createDateMatch[1].trim();
  }
  if (!metadata.ModDate) {
    const modDateMatch = rawText.match(/<xmp:ModifyDate>([^<]+)<\/xmp:ModifyDate>/i);
    if (modDateMatch) metadata.ModDate = modDateMatch[1].trim();
  }

  // Flag 1: Missing metadata entirely
  if (Object.keys(metadata).length === 0) {
    // If the PDF references an indirect /Info dictionary or object streams (/ObjStm) or /Metadata,
    // the dictionary is unresolved/indeterminate (e.g. stored in compressed object streams).
    // Treat an unresolved /Info dictionary as indeterminate rather than classifying as missing metadata.
    if (hasIndirectInfo || hasObjectStreams || hasMetadataStream) {
      metadata["status"] = "indeterminate";
      return { flags, metadata };
    }

    flags.push({
      region: "Document metadata",
      signal: "metadata",
      confidence: 0.55,
      explanation: "This document has no embedded metadata, which is unusual. Legitimate documents created by word processors or scanners almost always include creation date and software information. Stripped metadata is a common sign of document editing.",
      raw_detail: "No /Info dictionary or metadata stream found in PDF structure"
    });
    return { flags, metadata };
  }

  // Flag 2: Modification date significantly after creation date
  if (metadata.CreationDate && metadata.ModDate) {
    const created = parsePdfDate(metadata.CreationDate);
    const modified = parsePdfDate(metadata.ModDate);
    if (created && modified) {
      const diffDays = (modified.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 1) {
        flags.push({
          region: "Document metadata — timestamps",
          signal: "metadata",
          confidence: Math.min(0.45 + (diffDays / 100) * 0.4, 0.85),
          explanation: `This document was last modified ${Math.round(diffDays)} day(s) after it was created. For a document like an invoice or offer letter, modifications after the original creation date can suggest the content was changed after it was first produced.`,
          raw_detail: `CreationDate: ${metadata.CreationDate}, ModDate: ${metadata.ModDate}, diff: ${Math.round(diffDays)} days`
        });
      }
    }
  }

  // Flag 3: Image editing software detected
  const producer = (metadata.Producer ?? "").toLowerCase();
  const creator = (metadata.Creator ?? "").toLowerCase();
  const combined = producer + " " + creator;

  const editSoftwareFound = EDITING_SOFTWARE_KEYWORDS.find(kw => combined.includes(kw));
  if (editSoftwareFound) {
    const isScannerToo = SCANNER_SOFTWARE_KEYWORDS.some(kw => combined.includes(kw));
    if (!isScannerToo) {
      flags.push({
        region: "Document metadata — software",
        signal: "metadata",
        confidence: 0.72,
        explanation: `This document's metadata shows it was created or edited with "${editSoftwareFound}" — an image editing application. Legitimate payslips, invoices, and official letters are typically produced by document management software, not image editors. This is a strong signal worth investigating.`,
        raw_detail: `Producer: "${metadata.Producer}", Creator: "${metadata.Creator}"`
      });
    }
  }

  // Flag 4: Creator and Producer are inconsistent (e.g., scanner as creator, image editor as producer)
  if (metadata.Creator && metadata.Producer) {
    const creatorIsScanner = SCANNER_SOFTWARE_KEYWORDS.some(kw => creator.includes(kw));
    const producerIsEditor = EDITING_SOFTWARE_KEYWORDS.some(kw => producer.includes(kw));
    if (creatorIsScanner && producerIsEditor) {
      flags.push({
        region: "Document metadata — software mismatch",
        signal: "metadata",
        confidence: 0.82,
        explanation: `The document claims to have been scanned (Creator: "${metadata.Creator}") but was then processed through image editing software (Producer: "${metadata.Producer}"). This combination — scan then image edit — is a classic workflow for altering scanned documents.`,
        raw_detail: `Creator: "${metadata.Creator}", Producer: "${metadata.Producer}"`
      });
    }
  }

  return { flags, metadata };
}

/**
 * Inspects a JPEG or PNG image for EXIF presence and editing-software keywords
 * embedded in the image stream, flagging patterns inconsistent with camera or
 * scanner output.
 */
function inspectImageMetadata(rawText: string, fileType: string): { flags: MetadataFlag[]; metadata: Record<string, string> } {
  const flags: MetadataFlag[] = [];
  const metadata: Record<string, string> = {};

  // Check for EXIF marker in JPEG (0xFFE1) — presence indicates EXIF data
  const hasExif = rawText.includes("Exif") || rawText.includes("EXIF");
  const hasJfif = rawText.includes("JFIF");

  if (fileType === "image/jpeg" || fileType === "image/jpg") {
    if (!hasExif && !hasJfif) {
      flags.push({
        region: "Image metadata (EXIF)",
        signal: "metadata",
        confidence: 0.60,
        explanation: "This JPEG image has no EXIF data. While not conclusive on its own, EXIF data is automatically embedded by cameras and scanners. Its absence — especially combined with other signals — often indicates the image was processed or re-saved in an editing application that strips metadata.",
        raw_detail: "No EXIF or JFIF marker found in JPEG stream"
      });
    } else {
      metadata["EXIF"] = "Present";

      // Check for editing software in EXIF comments
      const editSoftwareFound = EDITING_SOFTWARE_KEYWORDS.find(kw => rawText.toLowerCase().includes(kw));
      if (editSoftwareFound) {
        flags.push({
          region: "Image metadata (EXIF software field)",
          signal: "metadata",
          confidence: 0.75,
          explanation: `The image's embedded metadata references "${editSoftwareFound}" — an image editing application. A document photo taken for verification purposes should show camera or scanner software, not an image editor.`,
          raw_detail: `Software keyword "${editSoftwareFound}" found in EXIF stream`
        });
      }
    }
  }

  return { flags, metadata };
}

// Main execution — Lamatic codeNode receives `inputs` from the trigger
const fileBase64: string = inputs.triggerNode_1?.output?.fileBase64 ?? "";
const fileType: string = inputs.triggerNode_1?.output?.fileType ?? "";
const fileName: string = inputs.triggerNode_1?.output?.fileName ?? "";

let result: MetadataResult = { flags: [], confidence: 0, summary: "No metadata analysis performed.", metadata_extracted: {} };

try {
  const bytes = decodeBase64ToBytes(fileBase64);
  // Convert to latin-1 string for text-based header parsing
  const rawText = Array.from(bytes).map(b => String.fromCharCode(b)).join("");

  let flags: MetadataFlag[] = [];
  let metadata: Record<string, string> = {};

  const isPdf = fileType === "application/pdf" || rawText.startsWith("%PDF");
  if (isPdf) {
    const { flags: pdfFlags, metadata: pdfMeta } = inspectPdfMetadata(rawText);
    flags = pdfFlags;
    metadata = pdfMeta;
  } else {
    const { flags: imgFlags, metadata: imgMeta } = inspectImageMetadata(rawText, fileType);
    flags = imgFlags;
    metadata = imgMeta;
  }

  const confidence = flags.length > 0
    ? Math.min(flags.reduce((sum, f) => sum + f.confidence, 0) / flags.length, 1.0)
    : 0;

  const summary = flags.length === 0
    ? "No metadata anomalies detected."
    : `${flags.length} metadata anomaly(ies) detected: ${flags.map(f => f.region).join("; ")}`;

  result = { flags, confidence, summary, metadata_extracted: metadata };
} catch (e: any) {
  result = {
    flags: [],
    confidence: 0,
    summary: `Metadata inspection failed: ${e.message}`,
    metadata_extracted: {}
  };
}

return result;
