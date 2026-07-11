Independently verify each extracted field against the source document below. Do not trust the extraction — prove each value from the exact text, or flag it.

## Source document (the ground truth)
"""
{{triggerNode_1.output.document}}
"""

## Extracted fields to verify (from the extraction stage — may contain errors)
"""
{{triggerNode_1.output.extraction}}
"""

Return the JSON array of verdicts described in your instructions, one entry per extracted field.
