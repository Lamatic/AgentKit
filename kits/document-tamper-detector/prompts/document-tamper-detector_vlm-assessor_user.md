You are performing a visual forensics assessment on an uploaded document.

## Document Information
- File name: {{triggerNode_1.output.fileName}}
- File type: {{triggerNode_1.output.fileType}}

## Flags Raised by Heuristic Checks
The following regions were flagged by automated analysis and require your visual assessment:

{{codeNode_ela.output.flagged_regions_description}}

## Previously Detected Signals
- Metadata flags: {{codeNode_metadata.output.summary}}
- OCR/Font flags: {{codeNode_ocr.output.summary}}
- ELA flags: {{codeNode_ela.output.summary}}

## Document Image (Base64)
{{triggerNode_1.output.fileBase64}}

## Your Task
For each flagged region described above, perform a visual assessment and return your findings in the exact JSON schema specified in the system prompt.

If the document is a PDF and visual rendering is not possible, base your assessment on the textual descriptions of the flagged regions provided above, and set `overall_vlm_confidence` to a lower value (0.3–0.5) to reflect limited visual access.

Focus on helping a non-expert (landlord, HR professional, or freelancer) understand whether the flagged region looks suspicious and why.
