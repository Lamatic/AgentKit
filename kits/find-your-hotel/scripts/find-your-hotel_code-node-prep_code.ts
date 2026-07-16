const city = {{triggerNode_1.output.city}};
const country = {{triggerNode_1.output.country}};
const rawCheckIn = {{triggerNode_1.output.checkIn}};
const rawCheckOut = {{triggerNode_1.output.checkOut}};
const rawAdults = {{triggerNode_1.output.adults}};
const rawRooms = {{triggerNode_1.output.rooms}};
const currency = {{triggerNode_1.output.currency}};
const rawRadius = {{triggerNode_1.output.radius}};

function toISODate(input) {
  if (!input) return input;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parts = input.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return input;
}

function toSafeInt(input, fallback) {
  const n = parseInt(input, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

output = {
  city: city,
  country: country,
  checkIn: toISODate(rawCheckIn),
  checkOut: toISODate(rawCheckOut),
  adults: toSafeInt(rawAdults, 1),
  rooms: toSafeInt(rawRooms, 1),
  currency: currency || "USD",
  radiusKm: toSafeInt(rawRadius, 10)
};