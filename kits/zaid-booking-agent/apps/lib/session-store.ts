export type BookingRequest = {
  service_type: string;
  preferred_date: string;
  preferred_window: string;
  name: string;
  phone: string;
  notes: string;
};

export type Slot = { date: string; time: string };

export type Session = {
  session_id: string;
  // Raw customer messages accumulated so far. The Intake Agent extracts from a single message
  // string with no memory of its own, so on a clarification round-trip we re-send the full
  // conversation joined together rather than just the latest reply.
  messages: string[];
  request: BookingRequest | null;
  status: "intake" | "scheduling" | "awaiting_confirmation" | "confirmed";
  proposed_slots: Slot[];
  confirmed_slot: Slot | null;
  confirmation_message: string | null;
};

// Single dev server, module-level Map — matches the "no need for Postgres until this is a
// real multi-instance deployment" call in the original stub. See docs/decision-log.md for why
// the app (not the flows) owns session state at all.
const sessions = new Map<string, Session>();
const lastTouched = new Map<string, number>();

// A booking conversation should complete in minutes; 24h is generous headroom for an
// interrupted session, not an expected duration. Dev-only demo, so a lazy sweep on every
// write is enough — no need for a background timer.
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function evictExpired() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, touchedAt] of lastTouched) {
    if (touchedAt < cutoff) {
      sessions.delete(id);
      lastTouched.delete(id);
    }
  }
}

function newSession(sessionId: string): Session {
  return {
    session_id: sessionId,
    messages: [],
    request: null,
    status: "intake",
    proposed_slots: [],
    confirmed_slot: null,
    confirmation_message: null,
  };
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function getOrCreateSession(sessionId: string): Session {
  evictExpired();
  lastTouched.set(sessionId, Date.now());
  const existing = sessions.get(sessionId);
  if (existing) return existing;
  const created = newSession(sessionId);
  sessions.set(sessionId, created);
  return created;
}

export function updateSession(sessionId: string, patch: Partial<Session>): Session {
  const updated = { ...getOrCreateSession(sessionId), ...patch };
  sessions.set(sessionId, updated);
  lastTouched.set(sessionId, Date.now());
  return updated;
}
