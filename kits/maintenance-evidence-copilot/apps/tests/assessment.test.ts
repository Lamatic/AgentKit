import assert from "node:assert/strict";
import test from "node:test";
import { userFacingAssessmentError } from "../lib/assessment-action-error";
import { decodeAssessmentResponse } from "../lib/assessment";
import { validateLamaticApiUrl } from "../lib/lamatic-client";

const assessment = {
  schemaVersion: "mec.assessment.v1",
  eventId: "EVT-MTR-101-A",
  asset: {
    assetId: "MTR-101",
    name: "Cooling Fan Drive Motor 101",
    component: "drive-end rolling-element bearing"
  },
  priority: { code: "P2", determinedBy: "deterministic_rules" },
  observations: { vibrationStatus: "warning", temperatureStatus: "warning" },
  supportingEvidence: [],
  contradictoryEvidence: [],
  possibleExplanations: [],
  unknowns: [],
  recommendedChecks: [],
  sources: [{ id: "PROC-VIB-01" }],
  rootCauseConfirmed: false,
  disclaimer: "Synthetic decision-support demonstration only."
};

test("decodes assessmentJson when Lamatic returns a JSON string", () => {
  const decoded = decodeAssessmentResponse({ result: { assessmentJson: JSON.stringify(assessment) } });
  assert.equal(decoded.eventId, "EVT-MTR-101-A");
  assert.equal(decoded.priority.code, "P2");
  assert.deepEqual(decoded.sources, [{ id: "PROC-VIB-01" }]);
});

test("decodes assessmentJson when Lamatic returns an object", () => {
  const decoded = decodeAssessmentResponse({ assessmentJson: assessment });
  assert.equal(decoded.asset.assetId, "MTR-101");
  assert.equal(decoded.rootCauseConfirmed, false);
});

test("classifies decoder-format errors as unexpected deployed-flow output", () => {
  assert.equal(
    userFacingAssessmentError(new Error("Lamatic returned an invalid asset.assetId.")),
    "The deployed flow returned an assessment in an unexpected format."
  );
});

test("requires encrypted non-loopback Lamatic endpoints", () => {
  assert.equal(validateLamaticApiUrl("https://example.lamatic.dev/graphql"), "https://example.lamatic.dev/graphql");
  assert.equal(validateLamaticApiUrl("http://127.0.0.1:3000/graphql"), "http://127.0.0.1:3000/graphql");
  assert.throws(
    () => validateLamaticApiUrl("http://example.lamatic.dev/graphql"),
    /must use https/
  );
});
