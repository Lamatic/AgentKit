// lib/store.ts
// Global state management via Zustand.
// Mock user object is structured to mirror a future database user model —
// swap out MOCK_USER with a fetched object and nothing else breaks.

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "viewer";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  role: UserRole;
  /** ISO 8601 date string */
  createdAt: string;
}

export interface AppState {
  // ── User ──────────────────────────────────────────────────────────────────
  user: AppUser;

  // ── Database connection ───────────────────────────────────────────────────
  connectionUrl: string;
  setConnectionUrl: (url: string) => void;
}

// ─── Initial / mock data ──────────────────────────────────────────────────────
const MOCK_USER: AppUser = {
  id: "usr_01",
  name: "Khush Vachhani",
  email: "admin@warehouse.ai",
  avatarInitials: "KV",
  role: "admin",
  createdAt: "2025-01-01T00:00:00.000Z",
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  user: MOCK_USER,
  connectionUrl: "",
  setConnectionUrl: (url) => set({ connectionUrl: url }),
}));
