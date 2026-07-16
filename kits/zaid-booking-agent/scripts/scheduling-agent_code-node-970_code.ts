const OPEN_SLOTS = [
  { date: "2026-07-13", time: "09:00" },
  { date: "2026-07-13", time: "11:00" },
  { date: "2026-07-13", time: "14:00" },
  { date: "2026-07-14", time: "10:00" },
  { date: "2026-07-14", time: "13:00" },
  { date: "2026-07-14", time: "16:00" },
  { date: "2026-07-15", time: "09:00" },
  { date: "2026-07-15", time: "15:00" },
  ];
  const requestedDate = {{triggerNode_1.output.preferred_date}};
  const sameDaySlots = OPEN_SLOTS.filter((slot) => slot.date === requestedDate);
  output.slot_available = sameDaySlots.length > 0;
  output.open_slots = sameDaySlots;
  const requestedTime = new Date(requestedDate).getTime();
  output.nearby_slots = [...OPEN_SLOTS]
    .sort((a, b) => Math.abs(new Date(a.date).getTime() - requestedTime) - Math.abs(new Date(b.date).getTime() - requestedTime))
    .slice(0, 3);
  output.proposed_slots = output.slot_available ? output.open_slots : output.nearby_slots;