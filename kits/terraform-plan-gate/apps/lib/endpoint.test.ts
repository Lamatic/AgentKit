import { test } from "node:test";
import assert from "node:assert/strict";
import { assertHttpsEndpoint, pinRedirectPolicy } from "./endpoint";

test("only https endpoints are accepted", () => {
  assert.equal(assertHttpsEndpoint("https://example.lamatic.dev/graphql"), "https://example.lamatic.dev/graphql");
  assert.equal(assertHttpsEndpoint("https://Example.lamatic.dev"), "https://example.lamatic.dev/", "canonical form: what the SDK will send");
  assert.throws(() => assertHttpsEndpoint("http://example.lamatic.dev/graphql"), /must use https/);
  assert.throws(() => assertHttpsEndpoint("ftp://example.lamatic.dev/graphql"), /must use https/);
  assert.throws(() => assertHttpsEndpoint("example.lamatic.dev/graphql"), /not a valid URL/);
});

test("requests to the Lamatic endpoint refuse redirects; other URLs are untouched", async () => {
  const seen: Array<{ url: string; redirect?: string }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    seen.push({ url, redirect: init?.redirect });
    return new Response("{}");
  }) as typeof fetch;
  try {
    pinRedirectPolicy("https://example.lamatic.dev/graphql");
    pinRedirectPolicy("https://example.lamatic.dev/graphql"); // idempotent
    await fetch("https://example.lamatic.dev/graphql", { method: "POST" });
    await fetch("https://example.org/other");
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(seen[0].redirect, "error");
  assert.equal(seen[1].redirect, undefined);
});
