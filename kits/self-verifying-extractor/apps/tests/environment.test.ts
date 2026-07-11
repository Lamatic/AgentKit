import { describe, expect, it } from "vitest";
import { validateEnvironment } from "../lib/environment";

const validEnvironment = {
  DOC_EXTRACT_FLOW: "extract-id",
  DOC_VERIFY_FLOW: "verify-id",
  DOC_REPORT_FLOW: "report-id",
  LAMATIC_API_URL: "https://example.lamatic.dev",
  LAMATIC_PROJECT_ID: "project-id",
  LAMATIC_API_KEY: "secret-key",
};

describe("validateEnvironment", () => {
  it("accepts complete Lamatic configuration", () => {
    expect(validateEnvironment(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejects copied placeholder values", () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, LAMATIC_API_URL: "LAMATIC_API_URL" }),
    ).toThrow("Missing or placeholder environment values: LAMATIC_API_URL");
  });

  it("rejects a non-absolute endpoint", () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, LAMATIC_API_URL: "lamatic.example" }),
    ).toThrow("complete absolute URL");
  });
});
