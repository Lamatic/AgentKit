Total pages: {{codeNode_format.output.page_count}}
{{#if codeNode_format.output.has_native_toc}} Native TOC found — use this as the structure basis: {{codeNode_format.output.toc_items}} {{else}} No TOC found — infer structure from these first 3 pages: {{codeNode_format.output.pages_json}} {{/if}}
Build a complete PageIndex tree covering all {{codeNode_format.output.page_count}} pages.