You are given a query and a document table of contents (TOC).
Navigate the TOC structure and find which LEAF sections (children: []) likely contain the answer.
Query: {{triggerNode_1.output.query}}
Document TOC (titles and structure only): {{codeNode_429.output.toc_json}}
Each node has start_index and end_index showing which pages it covers.
ONLY select nodes where children is [] (leaf nodes, not parent sections).
Reply with:
- thinking: your reasoning about which specific leaf sections contain the answer
- node_list: array of 2-3 leaf node_ids most likely to contain the answer