import { MAX_REQUEST_BODY_BYTES } from "./contracts";

export class RequestBodyTooLargeError extends Error {}
export class InvalidRequestBodyError extends Error {}

export async function readBoundedJsonBody(
  request: Request,
  maxBytes = MAX_REQUEST_BODY_BYTES,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw new RequestBodyTooLargeError(`Request bodies are limited to ${maxBytes} bytes.`);
    }
  }

  if (!request.body) return {};

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        void reader.cancel("Request body limit exceeded.");
        throw new RequestBodyTooLargeError(`Request bodies are limited to ${maxBytes} bytes.`);
      }
      try {
        text += decoder.decode(value, { stream: true });
      } catch (error) {
        if (error instanceof TypeError) {
          throw new InvalidRequestBodyError("Request body must contain valid UTF-8 JSON.");
        }
        throw error;
      }
    }
    try {
      text += decoder.decode();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new InvalidRequestBodyError("Request body must contain valid UTF-8 JSON.");
      }
      throw error;
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidRequestBodyError("Request body must contain valid JSON.");
    }
    throw error;
  }
}
