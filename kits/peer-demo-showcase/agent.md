# Peer Demo Showcase Hub Agent

## Capability
This agent accepts a GitHub repository URL, crawls the README, extracts project metadata, and matches the project to the best-fit sponsor from a community database.

## Inputs
- github_url: The GitHub repository URL of the submitted project
- builder_name: Name of the person submitting
- contact_email: Contact email of the submitter
- sponsors_list: Comma-separated string of active sponsor track names available for matching (e.g., "Google Cloud, Vercel, Supabase")

## Outputs
- project_title: Extracted project name
- description: One sentence summary
- tech_stack: Technologies used
- category: Project domain category
- matched_sponsor: Best matching sponsor name
- match_justification: Why this sponsor was matched
- breakout_table: Assigned event session