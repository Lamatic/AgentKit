"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Box,
  Package,
  Warehouse,
  ShoppingCart,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { STAT_CONFIG } from "@/constants";
import type { Stat } from "@/types";

// Stats values come from parent (fetched from DB on load)
type Props = {
  stats: Record<string, string>;
};

// Map each stat key to its icon
const ICONS: Record<string, React.ReactNode> = {
  totalProducts: <Box className="h-4 w-4" />,
  totalStock: <Package className="h-4 w-4" />,
  warehouses: <Warehouse className="h-4 w-4" />,
  pendingOrders: <ShoppingCart className="h-4 w-4" />,
};

export function StatsPanel({ stats }: Props) {
  const [open, setOpen] = useState(true);

  // Build Stat objects from config + live values
  const statItems: Stat[] = STAT_CONFIG.map((s) => ({
    label: s.label,
    value: stats[s.key] ?? "—",
    icon: ICONS[s.key],
  }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border">
          <span>OVERVIEW</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 border-b border-border">
          {statItems.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
