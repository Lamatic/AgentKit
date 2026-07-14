import { lookup } from "node:dns/promises";
import { request as requestHttp, type IncomingMessage } from "node:http";
import { request as requestHttps } from "node:https";
import { isIP, type LookupFunction } from "node:net";

const MAX_REDIRECTS = 3;
const MAX_DOWNLOAD_BYTES = 750_000;
const MAX_EVIDENCE_CHARS = 80_000;
const REQUEST_TIMEOUT_MS = 12_000;
const PAGE_FETCH_DEADLINE_MS = 12_000;

type ValidatedAddress = {
  address: string;
  family: 4 | 6;
};

export class PageEvidenceError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415 | 422 | 504 = 400,
  ) {
    super(message);
    this.name = "PageEvidenceError";
  }
}

function deadlineError() {
  return new PageEvidenceError("The webpage could not be retrieved within the time limit.", 504);
}

function remainingTime(deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw deadlineError();
  return remaining;
}

function withDeadline<T>(operation: Promise<T>, deadline: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(deadlineError()), remainingTime(deadline));
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string) {
  const normalized = ip.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mappedIpv4 = normalized.slice("::ffff:".length);
    if (isIP(mappedIpv4) === 4) return isPrivateIpv4(mappedIpv4);
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

async function assertPublicUrl(rawUrl: string, deadline: number) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PageEvidenceError("Enter a valid public URL, including https://.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new PageEvidenceError("Only HTTP and HTTPS URLs can be audited.");
  }
  if (url.username || url.password) {
    throw new PageEvidenceError("URLs containing credentials are not supported.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new PageEvidenceError("Local and private network addresses cannot be audited.");
  }

  const directIp = isIP(hostname);
  let addresses: Array<{ address: string }>;
  try {
    addresses = directIp
      ? [{ address: hostname }]
      : await withDeadline(lookup(hostname, { all: true, verbatim: true }), deadline);
  } catch (error) {
    if (error instanceof PageEvidenceError) throw error;
    throw new PageEvidenceError("The webpage hostname could not be resolved.");
  }
  if (addresses.length === 0) {
    throw new PageEvidenceError("The webpage hostname could not be resolved.");
  }

  const validatedAddresses: ValidatedAddress[] = [];
  for (const { address } of addresses) {
    const family = isIP(address);
    if ((family === 4 && isPrivateIpv4(address)) || (family === 6 && isPrivateIpv6(address))) {
      throw new PageEvidenceError("Local and private network addresses cannot be audited.");
    }
    if (family === 4 || family === 6) validatedAddresses.push({ address, family });
  }

  const pinnedAddress = validatedAddresses[0];
  if (!pinnedAddress) {
    throw new PageEvidenceError("The webpage hostname could not be resolved.");
  }

  return { url, pinnedAddress };
}

function requestPinnedPage(url: URL, pinnedAddress: ValidatedAddress, deadline: number) {
  const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [pinnedAddress]);
      return;
    }
    callback(null, pinnedAddress.address, pinnedAddress.family);
  };

  const request = url.protocol === "https:" ? requestHttps : requestHttp;
  return new Promise<IncomingMessage>((resolve, reject) => {
    const wallClockTimeout = remainingTime(deadline);
    const outgoing = request(
      url,
      {
        method: "GET",
        agent: false,
        lookup: pinnedLookup,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "AccessFix/1.0 (+https://github.com/Lamatic/AgentKit)",
        },
      },
      (response) => {
        const clearDeadline = () => clearTimeout(deadlineTimer);
        response.once("end", clearDeadline);
        response.once("close", clearDeadline);
        response.once("error", clearDeadline);
        resolve(response);
      },
    );

    const deadlineTimer = setTimeout(() => {
      outgoing.destroy(deadlineError());
    }, wallClockTimeout);
    outgoing.setTimeout(Math.min(REQUEST_TIMEOUT_MS, wallClockTimeout), () => {
      outgoing.destroy(deadlineError());
    });
    outgoing.on("error", (error) => {
      clearTimeout(deadlineTimer);
      reject(error);
    });
    outgoing.end();
  });
}

function compactHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function prepareHtmlEvidence(html: string) {
  const compacted = compactHtml(html);
  const truncated = compacted.length > MAX_EVIDENCE_CHARS;
  const pageContent = compacted.slice(0, MAX_EVIDENCE_CHARS);
  if (pageContent.length < 20) {
    throw new PageEvidenceError("The supplied HTML does not contain enough auditable content.", 422);
  }
  return { pageContent, truncated };
}

export async function fetchPublicPage(rawUrl: string) {
  const deadline = Date.now() + PAGE_FETCH_DEADLINE_MS;
  let target = await assertPublicUrl(rawUrl, deadline);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await requestPinnedPage(target.url, target.pinnedAddress, deadline);
    const status = response.statusCode ?? 0;

    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = response.headers.location;
      response.destroy();
      if (!location || redirect === MAX_REDIRECTS) {
        throw new PageEvidenceError("The webpage redirected too many times.", 422);
      }
      target = await assertPublicUrl(new URL(location, target.url).toString(), deadline);
      continue;
    }

    if (status < 200 || status >= 300) {
      response.destroy();
      throw new PageEvidenceError(`The webpage returned HTTP ${status}.`, 422);
    }
    const contentType = response.headers["content-type"]?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      response.destroy();
      throw new PageEvidenceError("The URL must return an HTML webpage.", 415);
    }

    const declaredLength = Number(response.headers["content-length"] ?? "0");
    if (declaredLength > MAX_DOWNLOAD_BYTES) {
      response.destroy();
      throw new PageEvidenceError("The webpage is too large to audit safely.", 413);
    }

    const chunks: Uint8Array[] = [];
    let received = 0;
    for await (const chunk of response) {
      const bytes = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);
      received += bytes.byteLength;
      if (received > MAX_DOWNLOAD_BYTES) {
        response.destroy();
        throw new PageEvidenceError("The webpage is too large to audit safely.", 413);
      }
      chunks.push(bytes);
    }

    if (received === 0) {
      throw new PageEvidenceError("The webpage returned no readable content.", 422);
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      url: target.url.toString(),
      ...prepareHtmlEvidence(new TextDecoder().decode(bytes)),
    };
  }

  throw new PageEvidenceError("Unable to retrieve the webpage.", 422);
}
