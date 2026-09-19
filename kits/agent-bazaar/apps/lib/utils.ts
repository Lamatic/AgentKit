import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatHash(hash: string, length: number = 8): string {
  if (!hash) return "—";
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatCredits(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.round(amount))} CRT`;
}

export function formatAmount(amount: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatInt(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(amount));
}

export function formatClock(date: string | Date): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "--:--:--";
  return value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function shortId(id: string, length: number = 6): string {
  if (!id) return "—";
  return id.length <= length + 6 ? id : `${id.slice(0, length)}…${id.slice(-4)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
