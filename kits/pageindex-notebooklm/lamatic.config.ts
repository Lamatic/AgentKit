export default {
  name: "PageIndex NotebookLM — Vectorless Tree-Structured RAG",
  description: "Upload any PDF and chat with it using vectorless, tree-structured RAG powered entirely by Lamatic AI flows. No vector database, no external Python server, no chunking — just a hierarchical document index built from the table of contents.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Saurabh Tiwari","email":"st108113@gmail.com","github":"https://github.com/Skt329"},
  tags: ["pageindex","rag","notebooklm","tree-structured-rag","document-chat","pdf","lamatic","next.js","agentkit"],
  steps: [
    {
        "id": "flow-1-upload-pdf-build-tree-save",
        "type": "mandatory",
        "envKey": "FLOW_ID_UPLOAD",
        "description": "Upload PDF → build hierarchical tree index → save to Supabase"
    },
    {
        "id": "chat-with-pdf",
        "type": "mandatory",
        "envKey": "FLOW_ID_CHAT",
        "description": "Tree-navigated search → page content fetch → LLM answer"
    },
    {
        "id": "flow-list-all-documents",
        "type": "mandatory",
        "envKey": "FLOW_ID_LIST",
        "description": "List all uploaded documents from Supabase"
    },
    {
        "id": "flow-4-get-tree-structure",
        "type": "mandatory",
        "envKey": "FLOW_ID_TREE",
        "description": "Get full tree JSON for a document or delete a document"
    }
],
  links: {
    "demo": "https://pageindex-notebooklm.vercel.app/",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/pageindex-notebooklm",
    "deploy": "https://pageindex-notebooklm.vercel.app/",
    "docs": "https://github.com/Skt329/AgentKit"
},
};
