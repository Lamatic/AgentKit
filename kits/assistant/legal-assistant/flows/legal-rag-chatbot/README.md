
<a href="https://studio.lamatic.ai/template/rag-chatbot" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

# Legal RAG Chatbot

## About This Flow

This flow builds a legal research chatbot that answers questions against a connected legal corpus. It works best when the underlying RAG source contains statutes, regulations, case summaries, internal legal guidance, or other curated legal reference material.

This flow includes **3 nodes** working together to process data efficiently.

## Flow Components

This workflow includes the following node types:
- chatTriggerNode
- RAGNode
- chatResponseNode

## Files Included

- **config.json** - Complete flow structure with nodes and connections
- **inputs.json** - Private inputs requiring configuration
- **meta.json** - Flow metadata and information

## Usage

1. Import this flow into your Lamatic workspace.
2. Point the RAG node at your legal knowledge base or vector store.
3. Test it with sample jurisdiction-specific legal questions.
4. Deploy it and wire the flow ID into `ASSISTANT_LEGAL_CHATBOT`.

## Next Steps

### Share with the Community

Help grow the Lamatic ecosystem by contributing improvements to AgentKit!

1. **Fork the Repository**
   - Visit [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit)
   - Fork the repository to your GitHub account

2. **Prepare Your Submission**
   - Create a new folder with a descriptive name for your flow
   - Add all files from this package (`config.json`, `inputs.json`, `meta.json`)
   - Write a comprehensive README.md that includes:
     - Clear description of what the flow does
     - Use cases and benefits
     - Step-by-step setup instructions
     - Required credentials and how to obtain them
     - Example inputs and expected outputs
     - Screenshots or diagrams (optional but recommended)

3. **Open a Pull Request**
   - Commit your changes with a descriptive message
   - Push to your forked repository
   - Open a PR to [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit)
   - Add a clear description of your flow in the PR

Your contribution will help others build amazing automations! 🚀

## Support

For questions or issues with this flow:
- Review the node documentation for specific integrations
- Check the Lamatic documentation at docs.lamatic.ai
- Contact support for assistance

## Tags

Legal, Research, Assistant

---
*Exported from Lamatic Template Library*
*Generated on 11/11/2025*
*Template ID: f67b91d0-0e62-4bb9-9eaf-828ea605ec3c*
