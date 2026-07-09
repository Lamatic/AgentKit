// Mock availability "store" for the Scheduling Agent's codeNode.
//
// This is intentionally a plain in-file array, not a database or API call — Lamatic Studio's
// cloud runtime can't reach localhost, so keeping mock data inline avoids needing to deploy
// anything to build/test the Scheduling flow. See docs/decision-log.md for the full reasoning.
//
// To swap in a real calendar later: replace getAvailability()'s body with a call to the
// Google Calendar API (or whatever provider), keeping the same (date, window) -> slots[]
// signature so the rest of the flow doesn't need to change.

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

// window is a loose string like "morning", "afternoon", "2pm", etc. — kept intentionally
// simple for MVP; real matching logic (parsing "morning" -> before 12:00, etc.) belongs here
// once the Intake Agent's actual output format for preferred_window is finalized.
function getAvailability(date, window) {
  const sameDay = OPEN_SLOTS.filter((slot) => slot.date === date);

  if (!window) {
    return sameDay;
  }

  // TODO: replace with real window matching once preferred_window's shape is settled
  // (e.g. "morning" | "afternoon" | "2pm" | "after 5pm").
  return sameDay;
}

function isSlotAvailable(date, time) {
  return OPEN_SLOTS.some((slot) => slot.date === date && slot.time === time);
}

module.exports = { OPEN_SLOTS, getAvailability, isSlotAvailable };
