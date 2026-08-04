const travelDate = {{triggerNode_1.output.travelDate}};
const days = {{triggerNode_1.output.days}};

const start = new Date(travelDate);
const end = new Date(start);
end.setDate(start.getDate() + days -1);
const endDate = end.toISOString().split('T')[0];

const today = new Date();
today.setHours(0,0,0,0);
const diffDays = Math.round((start - today) / (1000 * 60 * 60 * 24));
const forecastAvailable = diffDays >= 0 && diffDays <= 15;

output = {
  startDate: travelDate,
  endDate: endDate,
  forecastAvailable: forecastAvailable
};