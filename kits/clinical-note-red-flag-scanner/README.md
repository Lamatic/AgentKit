# Clinical Note Red-Flag Scanner

<a href="https://studio.lamatic.ai/template/clinical-note-red-flag-scanner" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

## About This Flow

Clinical documentation frequently ships with silent gaps — missing informed consent language, undocumented drug-interaction risk, incomplete vitals or history, ambiguous dosing instructions — that create real patient-safety and regulatory exposure. This flow accepts a clinical note as text input and returns a **structured, severity-ranked JSON list of documentation red flags** with specific reasoning for each one, so a clinician or compliance reviewer can triage quickly instead of re-reading the entire note.

This is a **structured compliance/safety analysis tool**, not a conversational agent or symptom checker. It may support documentation-review workflows related to general patient safety and internal compliance auditing. *Disclaimer: This template is a demonstration tool and does not provide formal regulatory certification, HIPAA compliance, CMS accreditation, or EU AI Act conformance.*

## What It Scans For

| Category | Description |
|----------|-------------|
| `CONSENT` | Missing or incomplete informed consent documentation |
| `DRUG_INTERACTION` | Prescribed medications with known unaddressed interactions (non-exhaustive) |
| `ALLERGY` | Allergy info missing, incomplete, or contradicted by prescriptions |
| `VITALS` | Missing or incomplete vital signs where clinically expected |
| `HISTORY` | Incomplete medical/surgical/family/social history |
| `DOSING` | Ambiguous or missing medication dosing (route, frequency, duration) |
| `FOLLOW_UP` | Missing follow-up plan or discharge instructions |
| `ASSESSMENT` | Incomplete clinical assessment relative to documented symptoms |
| `IDENTITY` | Missing patient identification markers (MRN, DOB, provider attestation) |
| `REGULATORY` | Gaps that may violate specific regulatory requirements |

Each flag includes a severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), a specific explanation, the location in the note (or `ABSENT`), and a remediation recommendation.

## Flow Components

This workflow includes **4 nodes** working together:

| Node | Type | Purpose |
|------|------|---------|
| API Request | `graphqlNode` | Trigger — accepts `{ clinicalNote: string }` input |
| Analyse Note | `LLMNode` | Core analysis — scans note against 10 red-flag categories |
| Variables | `variablesNode` | Maps LLM output to response format |
| API Response | `graphqlResponseNode` | Returns structured JSON result |

**Model:** Gemini (`gemini-3.1-flash-lite-preview`) via Gemini Key credential.

## Files Included

| File | Description |
|------|-------------|
| `lamatic.config.ts` | Template metadata, author, tags, and links |
| `flows/clinical-note-red-flag-scanner.ts` | Complete flow definition with nodes, edges, and references |
| `prompts/..._system_0.md` | System prompt — red-flag categories, severity definitions, JSON output schema |
| `prompts/..._user_1.md` | User prompt — injects the clinical note text |
| `model-configs/..._generative-model-name.ts` | Gemini model configuration |
| `constitutions/default.md` | Safety guardrails and data handling rules |
| `agent.md` | Agent identity, purpose, flow documentation |

## Usage

1. Import this template into your Lamatic workspace
2. Configure the required model credentials (Gemini API key)
3. Ensure input `clinicalNote` text is properly de-identified before submission (unless you have a zero-retention agreement with your LLM provider)
4. Test the flow with a sample clinical note
5. Deploy and integrate via the API endpoint

### Example Input

```json
{
  "clinicalNote": "Patient: TEST-001, 67M. Chief Complaint: Chest pain x 2 hours. History: HTN, DM2. Current Meds: Metformin 500mg BID, Lisinopril 10mg daily. Exam: BP 158/94, HR 88, RR 18. Lungs clear. Heart: regular rhythm, no murmurs. Assessment: Probable angina. Plan: Start aspirin 81mg daily, order stress test. Prescribed nitroglycerin PRN."
}
```

### Example Output

The flow returns a `result` field containing a JSON string with the serialized report:

```json
{
  "result": "{\"summary\":\"The clinical note lacks critical documentation regarding patient identification, comprehensive allergy assessment, and explicit medication instructions, posing significant regulatory and safety risks.\",\"flagCount\":5,\"flags\":[{\"id\":\"FLAG-001\",\"category\":\"IDENTITY\",\"severity\":\"CRITICAL\",\"title\":\"Missing Patient Identifiers and Provider Attestation\",\"detail\":\"The note lacks an MRN, DOB, and provider signature/attestation, making the record legally incomplete and difficult to attribute to a specific patient.\",\"location\":\"Header/Footer\",\"recommendation\":\"Ensure all clinical notes include full patient identifiers and a clear, timestamped provider signature.\"},{\"id\":\"FLAG-002\",\"category\":\"ALLERGY\",\"severity\":\"CRITICAL\",\"title\":\"Missing Allergy Information\",\"detail\":\"There is no documentation regarding the patient's allergy status, which is a requirement prior to prescribing new medications like nitroglycerin.\",\"location\":\"ABSENT\",\"recommendation\":\"Document patient allergy status or explicitly state 'NKDA' (No Known Drug Allergies).\"},{\"id\":\"FLAG-003\",\"category\":\"DOSING\",\"severity\":\"HIGH\",\"title\":\"Incomplete Medication Dosing Instructions\",\"detail\":\"The nitroglycerin prescription is missing frequency, route, and duration/maximum dose instructions.\",\"location\":\"Plan\",\"recommendation\":\"Ensure all medication orders contain complete dosing instructions including route and frequency.\"},{\"id\":\"FLAG-004\",\"category\":\"FOLLOW_UP\",\"severity\":\"HIGH\",\"title\":\"Incomplete Follow-up and Emergency Plan\",\"detail\":\"The note lacks clear instructions on follow-up timeline and return precautions.\",\"location\":\"Plan\",\"recommendation\":\"Document specific follow-up instructions and return precautions.\"},{\"id\":\"FLAG-005\",\"category\":\"HISTORY\",\"severity\":\"MEDIUM\",\"title\":\"Incomplete Social and Family History\",\"detail\":\"The history is missing smoking status, alcohol use, and relevant family history of premature coronary artery disease, which are standard for a 67-year-old presenting with chest pain.\",\"location\":\"History\",\"recommendation\":\"Complete a focused social and family history relevant to the differential diagnosis of angina.\"}]}"
}
```

## Known Limitations

- **JSON Output Validation**: The Lamatic Studio GraphQL Response node does not natively support strict JSON schema validation on the outbound response payload. While the LLM is heavily prompted to output a specific JSON structure, the flow cannot forcibly guarantee or reject malformed LLM outputs before returning them to the caller. Callers should safely parse the JSON string in the `result` field.
- **Jurisdiction is not verified**: The flow flags general regulatory issues but cannot verify specific state, local, or institutional mandates. The caller is responsible for supplying jurisdiction context or enforcing specific compliance rules downstream.
- **PHI De-identification is not enforced**: The flow cannot detect or redact Protected Health Information (PHI) before it is sent to the LLM. Callers must pre-process and de-identify notes before submission, or maintain a zero-retention agreement with the LLM provider.

## Next Steps

### Share with the Community

Help grow the Lamatic ecosystem by contributing improvements to AgentKit!

1. **Fork the Repository**
   - Visit [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit) and click "Fork"

2. **Make Your Changes**
   - Add new features, fix bugs, or improve documentation

3. **Submit a Pull Request**
   - Open a PR with a clear description of your changes
   - Follow the [Contributing Guide](../../CONTRIBUTING.md)
