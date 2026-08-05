// blob-upload.ts — turning an uploaded photo into a URL the flow can fetch.
//
// The Multi-Modal node fetches the image over the public internet, so a
// `blob:`, `data:`, or `file:` URL from the browser is useless to it. The photo
// has to be hosted somewhere reachable first.
//
// Vercel Blob is used when a token is present. When it is not, uploads are
// simply unavailable and the app falls back to accepting a pasted image URL —
// which is also how the bundled demo menus work. That fallback is why this kit
// can be run and reviewed without signing up for anything beyond Lamatic.

import { put } from "@vercel/blob";

/** Accepted image types. HEIC is included because iPhones default to it. */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Menus photographed at full resolution get large; 8 MB is a generous ceiling. */
const MAX_BYTES = 8 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/** True when the deployment can accept file uploads. */
export function isUploadConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token !== undefined && token.trim() !== "";
}

/**
 * Validates an uploaded file before it costs anything to store.
 *
 * @throws {UploadError} with a message written for the person holding the phone.
 */
export function assertUploadable(file: File): void {
  if (file.size === 0) {
    throw new UploadError("That file is empty. Try taking the photo again.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use one under 8 MB.`
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError(
      "That doesn't look like a photo. Upload a JPEG, PNG, WebP, or HEIC image."
    );
  }
}

/**
 * Uploads a menu photo and returns a public URL.
 *
 * The filename is sanitised and suffixed randomly, so one diner's upload can
 * neither collide with nor be guessed from another's.
 *
 * @throws {UploadError} when uploads are not configured or the file is rejected.
 */
export async function uploadMenuImage(file: File): Promise<string> {
  if (!isUploadConfigured()) {
    throw new UploadError(
      "Photo upload isn't configured on this deployment. Paste a link to a menu image instead."
    );
  }

  assertUploadable(file);

  const safeName = (file.name || "menu.jpg")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-64);

  try {
    const blob = await put(`menus/${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (cause) {
    // The underlying error can carry the token; never surface it.
    throw new UploadError(
      "That photo could not be uploaded. Try again, or paste a link to a menu image."
    );
  }
}
