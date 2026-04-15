type Priority = "High" | "Medium" | "Low"

export function normalizePriority(p: unknown): Priority {
  const s = String(p ?? "medium").trim().toLowerCase()
  const cap = (s.charAt(0).toUpperCase() + s.slice(1)) as Priority
  return (["High", "Medium", "Low"] as Priority[]).includes(cap) ? cap : "Medium"
}
