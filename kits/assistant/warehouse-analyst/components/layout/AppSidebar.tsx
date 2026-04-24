"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Warehouse,
  LayoutGrid,
  Sun,
  Moon,
  Settings,
  LogOut,
  ChevronUp,
  Database,
  User,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

const PROFILE_TOASTS = [
  "Unfortunately, no one can be told what the Matrix is. Same goes for your profile.",
  "There is no profile page. There is no spoon.",
  "Your profile? It exists only in the Matrix, Neo.",
];

const LOGOUT_TOASTS = [
  "You can't log out. You can only wake up.",
  "Blue pill: stay logged in. Red pill: figure out how to log out.",
  "Morpheus didn't say anything about a logout button.",
];

const DB_SUCCESS_TOASTS = [
  "Connection established. The Oracle said this would happen.",
  "You're in. The Matrix is loading your inventory…",
  "Database linked. Follow the white rabbit — it's in your stock list.",
];

const DB_FAIL_TOASTS = [
  "Connection failed. Even Morpheus couldn't hack through that.",
  "The Matrix rejected your connection string. Try again, Mr. Anderson.",
  "System error. Agent Smith must have gotten to the database first.",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// ─── Help content ─────────────────────────────────────────────────────────────

const HELP_CONTENT = `## 🏭 Warehouse Analyst — Quick Guide

**What is this?**
An AI-powered inventory assistant. Ask questions in plain English and get live answers directly from your PostgreSQL database — no SQL knowledge needed.

**How to get started**
1. Open **Settings** (user menu → Settings) and paste your PostgreSQL connection URL.
2. Watch the stats panel update automatically with live counts.
3. Type any inventory question in the chat box and press Enter.

**Example questions you can ask**
- *"How many products are low on stock?"*
- *"Which warehouse has the most pending orders?"*
- *"List all products in category Electronics."*
- *"What's the total inventory value?"*

**Database connection**
Your connection string is saved in memory only (session-scoped). For a permanent default, edit the \`DATABASE_URL\` variable in your \`.env.local\` file.

**Stats panel**
The bar above the chat shows live KPIs fetched on load. It collapses if you need more screen space — click the OVERVIEW row to toggle.

**Tech**
Next.js · Tailwind CSS · Shadcn/ui · Lamatic AI · PostgreSQL`;

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { user, connectionUrl, setConnectionUrl } = useAppStore();

  useEffect(() => setMounted(true), []);
  // keep draft in sync when store changes externally
  useEffect(() => setUrlDraft(connectionUrl), [connectionUrl]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Validate: try a quick HEAD/ping — for now we trust the format
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setIsSaving(false);
      return;
    }
    // Simulate brief async (real project would attempt connection test here)
    await new Promise((r) => setTimeout(r, 600));

    const isLikelyValid =
      trimmed.startsWith("postgresql://") ||
      trimmed.startsWith("postgres://");

    setConnectionUrl(trimmed);
    setSettingsOpen(false);
    setIsSaving(false);

    if (isLikelyValid) {
      toast.success(pick(DB_SUCCESS_TOASTS), {
        description: "Your inventory data will load now.",
        duration: 5000,
      });
    } else {
      toast.error(pick(DB_FAIL_TOASTS), {
        description: "Check that your URL starts with postgresql:// or postgres://",
        duration: 6000,
      });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        collapsible="icon"
        className="border-r border-border"
        style={
          {
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        {/* HEADER */}
        <SidebarHeader className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="The Warehouse Analyst">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                    <Warehouse className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">Warehouse</span>
                    <span className="text-xs text-muted-foreground">Analyst</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* NAV */}
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Chat" className="gap-2">
                <LayoutGrid className="h-5 w-5 flex-shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        {/* FOOTER */}
        <SidebarFooter className="p-2">
          <SidebarMenu>
            {/* Help button */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Help & Instructions"
                onClick={() => setHelpOpen(true)}
                className="gap-2"
              >
                <HelpCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden">Help</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Theme toggle */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={
                  mounted
                    ? theme === "dark"
                      ? "Light mode"
                      : "Dark mode"
                    : "Toggle theme"
                }
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="gap-2"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <Moon className="h-5 w-5 flex-shrink-0" />
                  )
                ) : (
                  <Sun className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="group-data-[collapsible=icon]:hidden">
                  {mounted
                    ? theme === "dark"
                      ? "Light mode"
                      : "Dark mode"
                    : "Toggle theme"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Separator className="my-1" />

            {/* User profile dropdown */}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full" asChild>
                  <button className="flex items-center gap-2 w-full rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {user.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start leading-none flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-medium truncate w-full">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {user.email}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="w-56 z-[9999]"
                >
                  <DropdownMenuLabel className="font-normal pb-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() =>
                      toast.info(pick(PROFILE_TOASTS), {
                        description: "Mock user — no profile page yet.",
                        duration: 4000,
                      })
                    }
                  >
                    <User className="h-4 w-4" />
                    Your Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => {
                      setUrlDraft(connectionUrl);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() =>
                      toast.info(pick(LOGOUT_TOASTS), {
                        description: "This is a mock session — no logout needed.",
                        duration: 4000,
                      })
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ── Database Settings Dialog ────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Connection
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <span>
                Enter your PostgreSQL connection URL. The schema is fetched
                dynamically — no manual table config needed.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="connection-url" className="text-sm font-medium">
                Connection URL
              </Label>
              <Input
                id="connection-url"
                type="password"
                placeholder="postgresql://user:password@host:5432/db"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                className="font-mono text-xs h-10"
              />
              <p className="text-xs text-muted-foreground">
                Format: <code>postgresql://user:password@host:port/database</code>
              </p>
            </div>

            {/* Temporary warning note */}
            <div className="flex gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Temporary session only.</span>{" "}
                This connection string is saved in memory and will be lost on page
                refresh. To set a permanent default, update the{" "}
                <code className="font-mono font-bold">DATABASE_URL</code> variable
                in your <code className="font-mono font-bold">.env.local</code> file.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!urlDraft.trim() || isSaving}
            >
              {isSaving ? "Connecting…" : "Save Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Help Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <HelpCircle className="h-5 w-5" />
              Help &amp; Instructions
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none py-2 text-sm leading-relaxed space-y-3">
            <p>
              <strong>What is this?</strong>
              <br />
              An AI-powered inventory assistant. Ask questions in plain English and
              get live answers directly from your PostgreSQL database — no SQL
              knowledge needed.
            </p>
            <p>
              <strong>How to get started</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                Open <strong>Settings</strong> (user menu → Settings) and paste
                your PostgreSQL connection URL.
              </li>
              <li>
                Watch the stats panel update automatically with live counts.
              </li>
              <li>Type any inventory question in the chat box and press Enter.</li>
            </ol>
            <p>
              <strong>Example questions you can ask</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><em>"How many products are low on stock?"</em></li>
              <li><em>"Which warehouse has the most pending orders?"</em></li>
              <li><em>"List all products in category Electronics."</em></li>
              <li><em>"What's the total inventory value?"</em></li>
            </ul>
            <p>
              <strong>Database connection</strong>
              <br />
              Your connection string is saved in memory only (session-scoped). For
              a permanent default, edit{" "}
              <code className="bg-muted px-1 rounded text-xs">DATABASE_URL</code>{" "}
              in your{" "}
              <code className="bg-muted px-1 rounded text-xs">.env.local</code>{" "}
              file.
            </p>
            <p>
              <strong>Stats panel</strong>
              <br />
              The bar above the chat shows live KPIs fetched on load. Click{" "}
              <em>OVERVIEW</em> to collapse/expand it.
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              Built with Next.js · Tailwind CSS · Shadcn/ui · Lamatic AI ·
              PostgreSQL
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setHelpOpen(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
