/**
 * Parse LLM Response and Extract Flight Parameters
 * Takes raw LLM output, extracts JSON, and structures flight search parameters
 */

const rawResponse = {{LLMNode_977.output.generatedResponse}};

// Extract JSON from the text using regex
const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('No JSON found in the response');
}

const parsedInput = JSON.parse(jsonMatch[0]);

// Check for vague request from LLM
if (parsedInput.message) {
    output = {
        status: 'vague_request',
        message: parsedInput.message,
        flights: [],
        searchParams: {
            origin: null,
            destination: null,
            departureDate: null
        }
    };
    // Stop here — don't call Duffel
    return output;
}

const origin = parsedInput.origin;
const destination = parsedInput.destination;
const departureDate = parsedInput.departureDate;

if (!origin || !destination || !departureDate) {
  throw new Error('Missing required fields: origin, destination, or departureDate');
}

const returnDate = parsedInput.returnDate && parsedInput.returnDate !== 'null' 
  ? parsedInput.returnDate 
  : null;

const passengers = parsedInput.passengers || 1;
const maxPrice = parsedInput.maxPrice && parsedInput.maxPrice !== 'null' 
  ? parsedInput.maxPrice 
  : null;

const minPrice = parsedInput.minPrice && parsedInput.minPrice !== 'null' 
  ? parsedInput.minPrice 
  : null;

const currency = parsedInput.currency || 'USD';

// Extract cabin class from LLM response
const cabinClass = parsedInput.cabinClass || 'economy';

// Preferences
const directFlightsOnly = parsedInput.preferences?.directFlightsOnly || false;
const preferredAirlines = parsedInput.preferences?.preferredAirlines || [];

// Determine trip type
const tripType = returnDate ? 'round-trip' : 'one-way';

// ============================================
// OUTPUT
// ============================================
output = {
  // Flight search parameters
  origin: origin,
  destination: destination,
  departureDate: departureDate,
  returnDate: returnDate,
  passengers: passengers,
  maxPrice: maxPrice,
  minPrice: minPrice,
  currency: currency,
  tripType: tripType,
  
  // Cabin class
  cabinClass: cabinClass,
  
  // Preferences
  directFlightsOnly: directFlightsOnly,
  preferredAirlines: preferredAirlines,
  
  // Build the Duffel search payload (for reference)
  duffelPayload: {
    slices: [
      {
        origin: origin,
        destination: destination,
        departure_date: departureDate,
        cabin_class: cabinClass
      }
    ],
    passengers: Array(passengers).fill({ 
      type: 'adult',
      cabin_class: cabinClass
    }),
    currency: currency
  },
  
  // Include return slice if round-trip
  duffelPayloadWithReturn: returnDate ? {
    slices: [
      {
        origin: origin,
        destination: destination,
        departure_date: departureDate,
        cabin_class: cabinClass
      },
      {
        origin: destination,
        destination: origin,
        departure_date: returnDate,
        cabin_class: cabinClass
      }
    ],
    passengers: Array(passengers).fill({ 
      type: 'adult',
      cabin_class: cabinClass
    }),
    currency: currency
  } : null,
  
  // Original parsed input (for debugging)
  _rawInput: parsedInput
};

console.log('✅ ===== Extracted Flight Parameters =====');
console.log(`   Origin: ${origin}`);
console.log(`   Destination: ${destination}`);
console.log(`   Departure: ${departureDate}`);
console.log(`   Return: ${returnDate || 'N/A'}`);
console.log(`   Passengers: ${passengers}`);
console.log(`   Max Price: ${maxPrice || 'Not set'} ${currency}`);
console.log(`   Min Price: ${minPrice || 'Not set'} ${currency}`);
console.log(`   Cabin Class: ${cabinClass}`);
console.log(`   Trip Type: ${tripType}`);
console.log(`   Direct Flights Only: ${directFlightsOnly}`);