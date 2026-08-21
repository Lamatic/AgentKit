Redact the following document so it is safe to embed into a RAG vector index. Replace sensitive spans with typed placeholders and produce the masked audit trail.

Redaction policy (may be empty — if empty, redact all sensitive categories):
{{triggerNode_1.output.policy}}

Document to redact:
"""
{{triggerNode_1.output.document}}
"""
