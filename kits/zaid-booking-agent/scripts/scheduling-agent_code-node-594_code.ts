const requestedDate = {{triggerNode_1.output.preferred_date}};
const openSlots = {{codeNode_970.output}}.open_slots;
output.slot_available = true;
output.proposed_slots = openSlots;
output.message = "Good news - we have an opening on " + requestedDate + ".";