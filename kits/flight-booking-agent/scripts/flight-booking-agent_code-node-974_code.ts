/**
 * Flight Booking Agent - Main Lamatic Flow
 * Extracts flight parameters, searches Duffel API, and returns cheapest options
 */

const flightParams = {{codeNode_383.output}};

// ============================================
//  CHECK FOR VAGUE REQUEST FIRST
// ============================================
if (flightParams.message) {
    console.log(' Vague request detected:', flightParams.message);
    output = {
        status: 'vague_request',
        message: flightParams.message,
        totalAvailable: 0,
        showing: 0,
        cheapestPrice: null,
        mostExpensive: null,
        currency: null,
        cabinClass: null,
        searchParams: {
            origin: null,
            destination: null,
            departureDate: null,
            returnDate: null,
            passengers: 1,
            minPrice: null,
            maxPrice: null,
            cabinClass: 'economy'
        },
        flights: []
    };
    console.log('===== DEBUG: Returning vague request message =====');
    return output;
}

const origin = flightParams.origin;
const destination = flightParams.destination;
const departureDate = flightParams.departureDate;
const returnDate = flightParams.returnDate || null;
const passengers = flightParams.passengers || 1;
const targetCurrency = flightParams.currency || 'USD';
const minPrice = flightParams.minPrice || null;
const maxPrice = flightParams.maxPrice || null;
const cabinClass = flightParams.cabinClass || 'economy';

// ============================================
//  CHECK FOR MISSING REQUIRED FIELDS
// ============================================
if (!origin || !destination || !departureDate) {
    console.error('❌ Missing required fields!');
    console.error('  origin:', origin);
    console.error('  destination:', destination);
    console.error('  departureDate:', departureDate);
    
    let missingFields = [];
    if (!origin) missingFields.push('origin');
    if (!destination) missingFields.push('destination');
    if (!departureDate) missingFields.push('departure date');
    
    const missingMessage = `I need more information to find flights. Please specify your ${missingFields.join(', ')}. Example: Flights from JFK to LHR on July 20`;
    
    output = {
        status: 'vague_request',
        message: missingMessage,
        totalAvailable: 0,
        showing: 0,
        cheapestPrice: null,
        mostExpensive: null,
        currency: null,
        cabinClass: null,
        searchParams: {
            origin: origin || null,
            destination: destination || null,
            departureDate: departureDate || null,
            returnDate: returnDate || null,
            passengers: passengers,
            minPrice: minPrice,
            maxPrice: maxPrice,
            cabinClass: cabinClass
        },
        flights: []
    };
    console.log('===== DEBUG: Returning missing fields message =====');
    return output;
}

const DUFFEL_API_KEY = {{secrets.project.DuffelAPIKEY}};

/**
 * Gets the current exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code (e.g., "USD")
 * @param {string} toCurrency - Target currency code (e.g., "ZAR")
 * @returns {Promise<number>} Exchange rate from fromCurrency to toCurrency
 */
async function getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];
        if (!rate) {
            console.warn(` Currency ${toCurrency} not found, using fallback rate 1`);
            return 1;
        }
        console.log(`Exchange rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
        return rate;
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
        const fallbackRates = {
            'USD': 1,
            'ZAR': 18.50,
            'NGN': 1600,
            'EUR': 0.92,
            'GBP': 0.78,
        };
        return fallbackRates[toCurrency] || 1;
    }
}

/**
 * Converts price using exchange rate
 * @param {number} price - Price to convert
 * @param {number} exchangeRate - Exchange rate to apply
 * @returns {number} Converted price rounded to 2 decimal places
 */
function convertPrice(price, exchangeRate) {
    return Math.round(price * exchangeRate * 100) / 100;
}

/**
 * Maps user-friendly cabin class to Duffel format
 * @param {string} cabinClass - User cabin class (economy, premium_economy, business, first)
 * @returns {string} Duffel-compatible cabin class
 */
function mapCabinClass(cabinClass) {
    const validClasses = ['economy', 'premium_economy', 'business', 'first'];
    if (validClasses.includes(cabinClass)) {
        return cabinClass;
    }
    return 'economy';
}

/**
 * Extracts cabin class from Duffel response segments
 * @param {Object} firstSegment - First flight segment from Duffel response
 * @param {Object} outboundSlice - Outbound flight slice from Duffel response
 * @returns {string} Cabin class name (economy, premium_economy, business, first)
 */
function extractCabinClass(firstSegment, outboundSlice) {
    if (firstSegment && firstSegment.passengers && firstSegment.passengers.length > 0) {
        const passenger = firstSegment.passengers[0];
        if (passenger.cabin && passenger.cabin.name) {
            return passenger.cabin.name;
        }
        if (passenger.cabin_class) {
            return passenger.cabin_class;
        }
    }
    
    if (outboundSlice && outboundSlice.cabin_class) {
        return outboundSlice.cabin_class;
    }
    
    if (firstSegment && firstSegment.cabin_class) {
        return firstSegment.cabin_class;
    }
    
    return 'economy';
}

/**
 * Searches for flights using Duffel API
 * @param {string} origin - Origin airport code (IATA)
 * @param {string} destination - Destination airport code (IATA)
 * @param {string} departureDate - Departure date (YYYY-MM-DD)
 * @param {string|null} returnDate - Return date (null for one-way)
 * @param {number} passengers - Number of passengers
 * @param {string} currency - Currency code for pricing
 * @param {string} cabinClass - Cabin class to search for
 * @returns {Promise<Array|null>} Array of flight offers or null on error
 */
async function searchFlightsWithDuffel(origin, destination, departureDate, returnDate, passengers, currency, cabinClass) {
    try {
        const duffelCabinClass = mapCabinClass(cabinClass);
        console.log(`✈️ Cabin Class: ${duffelCabinClass}`);
        
        const searchPayload = {
            data: {
                slices: [{
                    origin: origin,
                    destination: destination,
                    departure_date: departureDate,
                    cabin_class: duffelCabinClass
                }],
                passengers: []
            }
        };
        
        if (returnDate) {
            searchPayload.data.slices.push({
                origin: destination,
                destination: origin,
                departure_date: returnDate,
                cabin_class: duffelCabinClass
            });
        }
        
        for (let i = 0; i < passengers; i++) {
            searchPayload.data.passengers.push({ 
                type: 'adult',
                cabin_class: duffelCabinClass
            });
        }
        
        // Always use USD for Duffel API
        searchPayload.data.currency = 'USD';
        
        console.log('===== DEBUG: Duffel Request Payload =====');
        console.log(JSON.stringify(searchPayload, null, 2));
        
        const response = await fetch('https://api.duffel.com/air/offer_requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Duffel-Version': 'v2',
                'Authorization': `Bearer ${DUFFEL_API_KEY}`
            },
            body: JSON.stringify(searchPayload)
        });
        
        console.log('===== DEBUG: Duffel Response Status =====');
        console.log(` Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('===== DEBUG: Duffel API Error =====');
            console.error(`Status: ${response.status}`);
            console.error(`Error Body: ${errorText}`);
            return null;
        }
        
        const data = await response.json();
        const offers = data.data?.offers || [];
        
        console.log(`Found ${offers.length} offers from Duffel for ${duffelCabinClass} class`);
        
        return offers;
        
    } catch (error) {
        console.error('===== DEBUG: Exception in searchFlightsWithDuffel =====');
        console.error(`Error: ${error.message}`);
        return null;
    }
}

/**
 * Formats and filters Duffel flight offers by cabin class and price
 * @param {Array} offers - Raw Duffel offers
 * @param {string} targetCurrency - Target currency for pricing
 * @param {number} exchangeRate - Exchange rate to apply
 * @param {string} requestedCabin - User's requested cabin class
 * @param {number|null} minPrice - Minimum price filter (null for no filter)
 * @param {number|null} maxPrice - Maximum price filter (null for no filter)
 * @returns {Object} Formatted flights with count and filtered results
 */
function formatAndFilterOffers(offers, targetCurrency, exchangeRate, requestedCabin, minPrice, maxPrice) {
    if (!offers || offers.length === 0) {
        console.log('No offers to format');
        return { flights: [], count: 0 };
    }
    
    console.log(`Processing ${offers.length} offers for ${requestedCabin} class...`);
    
    const formattedFlights = [];
    let matchedCount = 0;
    let skippedCount = 0;
    let priceFilteredCount = 0;
    
    for (const offer of offers) {
        const outboundSlice = offer.slices[0];
        const inboundSlice = offer.slices.length > 1 ? offer.slices[1] : null;
        const outboundSegments = outboundSlice.segments || [];
        const inboundSegments = inboundSlice?.segments || [];
        const firstSegment = outboundSegments[0];
        const lastSegment = outboundSegments[outboundSegments.length - 1];
        
        const flightCabinClass = extractCabinClass(firstSegment, outboundSlice);
        
        if (flightCabinClass !== requestedCabin) {
            skippedCount++;
            continue;
        }
        
        // Calculate original price
        const originalPrice = parseFloat(offer.total_amount) || 0;
        const originalCurrency = offer.total_currency || 'USD';
        
     
        const convertedPrice = convertPrice(originalPrice, exchangeRate);
        
        // ============================================
        //  MANUAL PRICE FILTER
        // ============================================
        if (minPrice && convertedPrice < parseFloat(minPrice)) {
            priceFilteredCount++;
            continue;
        }
        if (maxPrice && convertedPrice > parseFloat(maxPrice)) {
            priceFilteredCount++;
            continue;
        }
        
        matchedCount++;
        
        let totalOutboundDuration = 0;
        outboundSegments.forEach(seg => {
            if (seg.duration) {
                const durationStr = seg.duration;
                const hoursMatch = durationStr.match(/(\d+)H/);
                const minutesMatch = durationStr.match(/(\d+)M/);
                const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
                const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
                totalOutboundDuration += (hours * 60) + minutes;
            }
        });
        
        let returnInfo = null;
        if (inboundSegments.length > 0) {
            const firstInboundSegment = inboundSegments[0];
            const lastInboundSegment = inboundSegments[inboundSegments.length - 1];
            returnInfo = {
                returnAirline: firstInboundSegment?.marketing_carrier?.name || 'N/A',
                returnFlightNumber: firstInboundSegment?.marketing_carrier_flight_number || 'N/A',
                returnDepartureTime: firstInboundSegment?.departing_at || 'N/A',
                returnArrivalTime: lastInboundSegment?.arriving_at || 'N/A',
            };
        }
        
        const isConverted = targetCurrency !== originalCurrency;
        
        formattedFlights.push({
            offerId: offer.id,
            airline: firstSegment?.marketing_carrier?.name || 'Unknown',
            airlineCode: firstSegment?.marketing_carrier?.iata_code || 'Unknown',
            airlineLogo: firstSegment?.marketing_carrier?.logo_symbol_url || null,
            flightNumber: firstSegment?.marketing_carrier_flight_number || 'N/A',
            departureAirport: firstSegment?.origin?.iata_code || 'N/A',
            departureTime: firstSegment?.departing_at || 'N/A',
            arrivalAirport: lastSegment?.destination?.iata_code || 'N/A',
            arrivalTime: lastSegment?.arriving_at || 'N/A',
            duration: totalOutboundDuration ? `${Math.floor(totalOutboundDuration / 60)}h ${totalOutboundDuration % 60}m` : 'N/A',
            stops: outboundSegments.length - 1,
            price: convertedPrice,
            currency: targetCurrency,
            originalPrice: originalPrice,
            originalCurrency: originalCurrency,
            exchangeRate: isConverted ? exchangeRate : null,
            isConverted: isConverted,
            cabinClass: flightCabinClass,
            isRoundTrip: !!inboundSlice,
            returnFlightNumber: returnInfo?.returnFlightNumber || null,
            returnDepartureTime: returnInfo?.returnDepartureTime || null,
            returnArrivalTime: returnInfo?.returnArrivalTime || null,
            directBookingUrl: `https://www.duffel.com/offers/${offer.id}`,
            expiresAt: offer.expires_at
        });
    }
    
    console.log(`Matched ${matchedCount} ${requestedCabin} class flights out of ${offers.length} total`);
    console.log(`  Skipped (wrong cabin): ${skippedCount}`);
    console.log(`  Skipped (price filter): ${priceFilteredCount}`);
    
    return {
        flights: formattedFlights,
        count: matchedCount
    };
}

console.log('===== DEBUG: Starting Duffel Search =====');

const exchangeRate = await getExchangeRate('USD', targetCurrency);
console.log(`Exchange rate: 1 USD = ${exchangeRate} ${targetCurrency}`);
console.log(`Requested Cabin Class: ${cabinClass}`);
console.log(`Price filter: ${minPrice ? `Min: ${minPrice}` : 'No min'} ${maxPrice ? `Max: ${maxPrice}` : 'No max'}`);

// Remove price filters from Duffel request
const offers = await searchFlightsWithDuffel(
    origin,
    destination,
    departureDate,
    returnDate,
    passengers,
    targetCurrency,
    cabinClass
);

let flights = [];
let displayStatus = 'success';
let displayMessage = '';

if (offers && offers.length > 0) {
    // Apply manual price filter after formatting
    const result = formatAndFilterOffers(offers, targetCurrency, exchangeRate, cabinClass, minPrice, maxPrice);
    flights = result.flights;
    
    if (flights.length === 0) {
        displayStatus = 'no_results';
        let priceMsg = '';
        if (minPrice && maxPrice) {
            priceMsg = ` between ${minPrice} and ${maxPrice}`;
        } else if (minPrice) {
            priceMsg = ` above ${minPrice}`;
        } else if (maxPrice) {
            priceMsg = ` under ${maxPrice}`;
        }
        displayMessage = `No ${cabinClass} class flights found from ${origin} to ${destination} on ${departureDate}${priceMsg}`;
        console.log(`${displayMessage}`);
    } else {
        let priceMsg = '';
        if (minPrice && maxPrice) {
            priceMsg = ` between ${minPrice} and ${maxPrice}`;
        } else if (minPrice) {
            priceMsg = ` above ${minPrice}`;
        } else if (maxPrice) {
            priceMsg = ` under ${maxPrice}`;
        }
        displayMessage = `Found ${flights.length} ${cabinClass} class flights in ${targetCurrency}${priceMsg}`;
        console.log(`${displayMessage}`);
    }
} else {
    displayStatus = 'no_results';
    displayMessage = `No ${cabinClass} class flights found from ${origin} to ${destination} on ${departureDate}`;
    console.log(`${displayMessage}`);
}

const showing = flights.length;
const cheapestPrice = flights.length > 0 ? flights[0].price : null;
const mostExpensive = flights.length > 0 ? flights[flights.length - 1].price : null;
const displayCurrency = targetCurrency;

output = {
    status: displayStatus,
    message: displayMessage,
    totalAvailable: flights.length,
    showing: showing,                  
    cheapestPrice: cheapestPrice,  
    mostExpensive: mostExpensive,         
    currency: displayCurrency,           
    cabinClass: cabinClass,
    searchParams: {
        origin: origin,
        destination: destination,
        departureDate: departureDate,
        returnDate: returnDate,
        passengers: passengers,
        minPrice: minPrice,
        maxPrice: maxPrice,
        cabinClass: cabinClass
    },
    flights: flights
};

console.log('===== DEBUG: Script Execution Complete =====');