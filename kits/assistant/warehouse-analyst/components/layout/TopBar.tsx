import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-border px-4 flex-shrink-0">
      <SidebarTrigger className="h-7 w-7" />
      <Separator orientation="vertical" className="h-4" />
      <span className="text-sm font-medium text-muted-foreground">
        Inventory Assistant
      </span>
    </div>
  );
}
