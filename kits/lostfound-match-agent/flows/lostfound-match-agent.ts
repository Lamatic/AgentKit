/*
# LostFound Match Agent

This flow compares a lost item report with a found item report and returns a structured match recommendation.

It is designed for campuses, airports, metro stations, malls, hotels, and other public places where lost and found reports are handled manually.
*/

export const meta = {
  name: "LostFound Match Agent",
  description:
    "Compares lost and found item reports and returns a match score, reasoning, verification questions, and next action.",
  tags: ["lost-and-found", "matching", "automation", "json"],
  testInput: {
    lost_item_description:
      "Black leather wallet lost near library. It had my student ID card and some cash.",
    found_item_description:
      "Dark wallet found near reading room with a college ID card inside.",
    lost_location: "Library",
    found_location: "Reading room",
    lost_date: "2026-05-10",
    found_date: "2026-05-10"
  },
  author: {
    name: "Rewant Anand",
    github: "Rewant05"
  }
};

export const inputs = {
  lost_item_description: {
    type: "string",
    required: true,
    description: "Description of the lost item reported by the user."
  },
  found_item_description: {
    type: "string",
    required: true,
    description: "Description of the found item reported by another user or admin."
  },
  lost_location: {
    type: "string",
    required: false,
    description: "Location where the item was lost."
  },
  found_location: {
    type: "string",
    required: false,
    description: "Location where the item was found."
  },
  lost_date: {
    type: "string",
    required: false,
    description: "Date when the item was lost."
  },
  found_date: {
    type: "string",
    required: false,
    description: "Date when the item was found."
  }
};

export const references = {
  prompts: {
    system: "@prompts/lostfound-match-agent_system.md"
  }
};

export default {
  meta,
  inputs,
  references
};
