# Smart Travel Planner

Smart Travel Planner is an agentic AI travel planning kit built with Lamatic AI.  
It generates structured travel itineraries based on destination, number of days, budget, and travel style.

## Features

- AI-generated travel itineraries
- Day-wise structured planning
- Budget-aware trip suggestions
- Local food and stay recommendations
- Cultural highlights and travel tips
- Travel-focused assistant flow

## Included Flow

### smart-travel-flow
Generates a complete travel itinerary in structured JSON format.

## Inputs

- destination
- number_of_days
- budget
- travel_style

## Output

Structured travel itinerary JSON including:

- destination overview
- best time to visit
- budget estimate
- highlights
- food recommendations
- cultural notes
- travel tips
- day-wise itinerary

## Environment Variables

Add the following variables:

```env
LAMATIC_API_URL=your_lamatic_api_url
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_FLOW_URL=your_flow_url
LAMATIC_API_KEY=your_lamatic_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key


