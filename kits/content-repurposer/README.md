
<a href="https://studio.lamatic.ai/template/content-repurposer" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

# Content Repurposer

## About This Flow

Takes a blog post/article URL or raw text and repurposes it into multiple content formats: LinkedIn post, Twitter/X thread, newsletter blurb, and key takeaways for efficient cross-platform content distribution.

This flow includes **4 nodes** working together to process data efficiently.

## Flow Components

This workflow includes the following node types:
- graphqlNode
- scraperNode
- LLMNode
- graphqlResponseNode

## Files Included

- **lamatic.config.ts** - Project metadata and configuration
- **flows/content-repurposer.ts** - Complete flow structure with nodes and connections
- **prompts/** - Externalized LLM prompts for content generation
- **model-configs/** - Model configuration for text generation

## Usage

1. Import this template into your Lamatic workspace
2. Configure the required credentials (Firecrawl API key, LLM provider key)
3. Test the flow with a sample article URL or paste raw content
4. Deploy and integrate into your content distribution pipeline

### Example Input

```json
{
  "contentUrl": "https://example.com/blog-post"
}
```

or

```json
{
  "contentText": "Your long-form article content goes here..."
}
```

### Example Output

```json
{
  "content": "LINKEDIN_POST:\nProfessional LinkedIn post content...\n\nTWITTER_THREAD:\n1/5 First tweet...\n\n2/5 Second tweet...\n\nNEWSLETTER_BLURB:\nEmail-friendly newsletter section...\n\nKEY_TAKEAWAYS:\n- Key takeaway 1\n- Key takeaway 2\n- Key takeaway 3"
}
```

The response contains all four formats in a single string with clear section headers for easy client-side parsing.

## Next Steps

### Share with the Community

Help grow the Lamatic ecosystem by contributing improvements to AgentKit!

1. **Fork the Repository**
   - Visit [github.com/Lamatic/AgentKit](https://github.com/Lamatic/AgentKit)
   - Fork the repository to your GitHub account

2. **Prepare Your Submission**
   - Create a new folder with a descriptive name for your flow
   - Add all files from this package
   - Write a comprehensive README.md that includes:
     - Clear description of what the flow does
     - Use cases and benefits
     - Step-by-step setup instructions
     - Required credentials and how to obtain them
     - Example inputs and expected outputs

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

Content, Social Media, Marketing

---
*Exported from Lamatic Template Library*
