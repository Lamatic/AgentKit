const OPEN_SLOTS = [{date:"2026-07-13",time:"09:00"},{date:"2026-07-13",time:"11:00"},{date:"2026-07-13",time:"14:00"},{date:"2026-07-14",time:"10:00"},{date:"2026-07-14",time:"13:00"},{date:"2026-07-14",time:"16:00"},{date:"2026-07-15",time:"09:00"},{date:"2026-07-15",time:"15:00"}];
const confirmedDate = {{triggerNode_1.output.confirmed_date}};
const confirmedTime = {{triggerNode_1.output.confirmed_time}};
output.booked = OPEN_SLOTS.some((slot) => slot.date === confirmedDate && slot.time === confirmedTime);