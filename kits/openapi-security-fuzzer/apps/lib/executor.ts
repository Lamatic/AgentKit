export interface TestPayload {
  test_id: string;
  category: string;
  objective: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  payload?: any;
  expected_secure_behavior: string;
  severity_if_confirmed: string;
  confidence: string;
  reasoning: string;
}

export interface ExecutionResult {
  test_id: string;
  status_code: number;
  response_body: string;
  success: boolean;
  error?: string;
  response_time_ms: number;
}

// Ensure the path properly joins with the base URL
function buildUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export async function executeTests(
  baseUrl: string,
  authHeader: string,
  testPayloads: TestPayload[],
  concurrencyLimit: number = 5
): Promise<ExecutionResult[]> {
  
  const results: ExecutionResult[] = [];
  const queue = [...testPayloads];
  
  // Worker function that processes payloads from the queue until empty
  async function worker() {
    while (queue.length > 0) {
      const test = queue.shift();
      if (!test) continue;
      
      const url = buildUrl(baseUrl, test.path);
      
      // Merge headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(test.headers || {})
      };
      
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      const options: RequestInit = {
        method: test.method.toUpperCase(),
        headers,
      };

      // Attach payload if method is not GET/HEAD
      if (["POST", "PUT", "PATCH", "DELETE"].includes(options.method as string) && test.payload) {
        options.body = typeof test.payload === 'string' ? test.payload : JSON.stringify(test.payload);
      }

      const startTime = Date.now();
      try {
        const response = await fetch(url, options);
        const responseTimeMs = Date.now() - startTime;
        
        // Read response body safely
        let responseText = "";
        try {
          responseText = await response.text();
          // Truncate very large bodies to prevent context length explosion
          if (responseText.length > 500) {
            responseText = responseText.substring(0, 500) + "... (truncated)";
          }
        } catch (e) {
          responseText = "Failed to read response body";
        }

        results.push({
          test_id: test.test_id,
          status_code: response.status,
          response_body: responseText,
          success: true,
          response_time_ms: responseTimeMs,
        });
      } catch (error: any) {
        results.push({
          test_id: test.test_id,
          status_code: 0,
          response_body: "",
          success: false,
          error: error.message || "Request failed",
          response_time_ms: Date.now() - startTime,
        });
      }
    }
  }

  // Start 'concurrencyLimit' workers
  const workers = Array.from({ length: Math.min(concurrencyLimit, testPayloads.length) }).map(() => worker());
  await Promise.all(workers);

  return results;
}
