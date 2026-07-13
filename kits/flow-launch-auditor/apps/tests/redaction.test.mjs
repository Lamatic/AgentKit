import assert from "node:assert/strict";
import test from "node:test";
import { redactSecretValues } from "../lib/redaction.js";

test("redactSecretValues preserves env names and removes obvious secret values", () => {
  const text = "BILLING_API_KEY=sk-real-secret-value API_KEY=sk-standalone-secret GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234";
  const redacted = redactSecretValues(text);

  assert.equal(redacted.includes("sk-real-secret-value"), false);
  assert.equal(redacted.includes("sk-standalone-secret"), false);
  assert.equal(redacted.includes("ghp_abcdefghijklmnopqrstuvwxyz1234"), false);
  assert.equal(redacted.includes("BILLING_API_KEY=<redacted>"), true);
  assert.equal(redacted.includes("API_KEY=<redacted>"), true);
  assert.equal(redacted.includes("GITHUB_TOKEN=<redacted>"), true);
});

test("redactSecretValues redacts bearer tokens in pasted config", () => {
  const redacted = redactSecretValues("Authorization: Bearer abcdefghijklmnop");

  assert.equal(redacted, "Authorization: Bearer <redacted>");
});

test("redactSecretValues redacts quoted assignment values with spaces", () => {
  const redacted = redactSecretValues("SECRET=\"my value here\" PASSWORD='another value here'");

  assert.equal(redacted, "SECRET=<redacted> PASSWORD=<redacted>");
});

test("redactSecretValues redacts unquoted assignment values with spaces", () => {
  const redacted = redactSecretValues("MY_SECRET=hello world API_KEY=sk-next-secret");

  assert.equal(redacted, "MY_SECRET=<redacted> API_KEY=<redacted>");
});

test("redactSecretValues redacts PEM-style private key assignments", () => {
  const text = `PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
line one
line two
-----END RSA PRIVATE KEY-----
SAFE_VALUE=visible`;
  const redacted = redactSecretValues(text);

  assert.equal(redacted.includes("line one"), false);
  assert.equal(redacted.includes("line two"), false);
  assert.equal(redacted.includes("PRIVATE_KEY=<redacted>"), true);
  assert.equal(redacted.includes("SAFE_VALUE=visible"), true);
});

test("redactSecretValues redacts bare PEM blocks", () => {
  const text = `Certificate material:
-----BEGIN PRIVATE KEY-----
line one
line two
-----END PRIVATE KEY-----
Safe setup notes remain.`;
  const redacted = redactSecretValues(text);

  assert.equal(redacted, "Certificate material:\n<redacted>\nSafe setup notes remain.");
});

test("redactSecretValues redacts common generic key assignments", () => {
  const text = [
    "STRIPE_SECRET_KEY=stripe-value",
    "AWS_SECRET_ACCESS_KEY=aws-secret-value",
    "ENCRYPTION_KEY=encryption-value",
    "DJANGO_SECRET_KEY=django-value"
  ].join("\n");
  const redacted = redactSecretValues(text);

  assert.equal(redacted, [
    "STRIPE_SECRET_KEY=<redacted>",
    "AWS_SECRET_ACCESS_KEY=<redacted>",
    "ENCRYPTION_KEY=<redacted>",
    "DJANGO_SECRET_KEY=<redacted>"
  ].join("\n"));
});

test("redactSecretValues preserves ordinary key labels", () => {
  const text = "Database primary key: id\nKey: launch readiness depends on evidence";

  assert.equal(redactSecretValues(text), text);
});

test("redactSecretValues redacts bearer values containing spaces", () => {
  const redacted = redactSecretValues("Authorization: Bearer abcdefghijkl mnopqrstuv");

  assert.equal(redacted, "Authorization: Bearer <redacted>");
});

test("redactSecretValues redacts short Basic auth credentials", () => {
  const redacted = redactSecretValues("Authorization: Basic dTpw");

  assert.equal(redacted, "Authorization: Basic <redacted>");
});

test("redactSecretValues redacts common cloud, auth, database, and JWT secrets", () => {
  const text = [
    "AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF",
    "Authorization: Basic dXNlcjpwYXNzd29yZA==",
    "refreshToken=rt_example_secret_value_12345",
    "DATABASE_URL=postgres://user:pass@example.com:5432/audit",
    "MONGO_URL=mongodb+srv://user:pass@example.mongodb.net/audit",
    "SESSION_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  ].join("\n");
  const redacted = redactSecretValues(text);

  assert.equal(redacted.includes("AKIA1234567890ABCDEF"), false);
  assert.equal(redacted.includes("dXNlcjpwYXNzd29yZA=="), false);
  assert.equal(redacted.includes("rt_example_secret_value_12345"), false);
  assert.equal(redacted.includes("postgres://user:pass@example.com:5432/audit"), false);
  assert.equal(redacted.includes("mongodb+srv://user:pass@example.mongodb.net/audit"), false);
  assert.equal(redacted.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"), false);
  assert.equal(redacted.includes("AWS_ACCESS_KEY_ID=<redacted>"), true);
  assert.equal(redacted.includes("Authorization: Basic <redacted>"), true);
  assert.equal(redacted.includes("refreshToken=<redacted>"), true);
  assert.equal(redacted.includes("DATABASE_URL=<redacted>"), true);
  assert.equal(redacted.includes("MONGO_URL=<redacted>"), true);
  assert.equal(redacted.includes("SESSION_JWT=<redacted>"), true);
});

test("redactSecretValues redacts webhook URL assignments", () => {
  const text = [
    "WEBHOOK_URL=https://hooks.slack.com/services/T000/B000/SECRET",
    "DISCORD_WEBHOOK='https://discord.com/api/webhooks/123/secret'"
  ].join("\n");
  const redacted = redactSecretValues(text);

  assert.equal(redacted.includes("hooks.slack.com"), false);
  assert.equal(redacted.includes("discord.com"), false);
  assert.match(redacted, /WEBHOOK_URL=<redacted>/);
  assert.match(redacted, /DISCORD_WEBHOOK=<redacted>/);
});

test("redactSecretValues redacts unlabelled secret-bearing webhook URLs", () => {
  const redacted = redactSecretValues([
    "Send failures to https://hooks.slack.com/services/T000/B000/SECRET",
    "Backup: https://discord.com/api/webhooks/123/secret"
  ].join("\n"));

  assert.equal(redacted.includes("hooks.slack.com"), false);
  assert.equal(redacted.includes("discord.com/api/webhooks"), false);
  assert.equal(redacted, "Send failures to <redacted>\nBackup: <redacted>");
});

test("redactSecretValues redacts compact JWT-like tokens", () => {
  const redacted = redactSecretValues("SESSION_JWT=eyJhbGciOiJIUzI1NiJ9.e30.");

  assert.equal(redacted, "SESSION_JWT=<redacted>");
});
