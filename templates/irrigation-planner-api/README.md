<a href="https://studio.lamatic.ai/template/irrigation-planner-api" target="_blank" style="text-decoration:none;">
  <div align="right">
    <span style="display:inline-block;background:#e63946;color:#fff;border-radius:6px;padding:10px 22px;font-size:16px;font-weight:bold;letter-spacing:0.5px;text-align:center;transition:background 0.2s;box-shadow:0 2px 8px 0 #0001;">Deploy on Lamatic</span>
  </div>
</a>

# Irrigation Planner API

## About This Flow

This LLM-powered irrigation planning API processes plant data, location, and date inputs to generate structured watering schedules, enabling adaptive and context-aware irrigation planning based on environmental conditions and plant needs.

## Flow Components

This workflow includes the following node types:
- API Request
- Generate JSON
- API Response

## Configuration Requirements

This flow requires configuration for **1 node(s)** with private inputs (credentials, API keys, model selections, etc.). All required configurations are documented in the `inputs.json` file.

## Files Included

- **config.json** - Complete flow structure with nodes and connections
- **inputs.json** - Private inputs requiring configuration
- **meta.json** - Flow metadata and information
- 
## Usage
### Input
The API takes three main inputs:
* A list of plant types in list of string
* Location information
* A target start date 

### Output
The system produces structured JSON Object including:
* 7-day irrigation schedule including date and daily watering durations.
    * Date formatted as MM/DD/YYYY. Duration is in minutes.
* A reasoning behind the plan
* A brief reasoning summary for decisions


## Next Steps

### Share with the Community

Help grow the Lamatic ecosystem by contributing this flow to AgentKit!

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

---
*Exported from Lamatic Flow Editor*
*Generated on 4/17/2026*
