const hotels = {{InstructorLLMNode_hotels.output.hotels}};
const city = {{codeNode_prep.output.city}};
const country = {{codeNode_prep.output.country}};

const withMaps = hotels.map(function(h) {
  const query = h.name + ', ' + h.areaDescription + ', ' + city + ', ' + country;
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  return {
    name: h.name,
    areaDescription: h.areaDescription,
    approxPricePerNight: h.approxPricePerNight,
    priceConfidence: h.priceConfidence,
    phoneNumber: h.phoneNumber,
    googleMapsUrl: mapsUrl
  };
});

output = {
  hotels: withMaps
};