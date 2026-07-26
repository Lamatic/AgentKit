"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UrlChip } from "@/lib/source-templates";
import { Loader2, Pencil, X } from "lucide-react";

function chipClasses(status: UrlChip["status"]) {
  switch (status) {
    case "ok":
      return "border-emerald-500/50 bg-emerald-500/10 text-foreground";
    case "error":
      return "border-destructive/60 bg-destructive/10 text-foreground";
    case "checking":
    case "pending":
      return "border-muted-foreground/30 bg-muted/50 text-muted-foreground";
    default:
      return "border-border bg-muted/40";
  }
}

export function UrlChipList({
  chips,
  editingId,
  editValue,
  locked,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onRemove,
}: {
  chips: UrlChip[];
  editingId: string | null;
  editValue: string;
  locked?: boolean;
  onStartEdit: (chip: UrlChip) => void;
  onEditChange: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (id: string) => void;
}) {
  if (!chips.length) return null;

  return (
    <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
      {chips.map((chip) => (
        <li key={chip.id} className="max-w-full">
          {editingId === chip.id && !locked ? (
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-primary/40 bg-background px-3 py-1.5">
              <input
                className="min-w-[12rem] flex-1 bg-transparent text-xs font-mono outline-none"
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onCommitEdit();
                  }
                  if (e.key === "Escape") onCancelEdit();
                }}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onCommitEdit}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div
              className={`flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${chipClasses(chip.status)}`}
            >
              <Badge
                variant="outline"
                className="h-5 shrink-0 px-1.5 text-[10px] font-normal"
              >
                {chip.origin === "template" ? "Template" : "Custom"}
              </Badge>
              {chip.status === "checking" || chip.status === "pending" ? (
                <Loader2 className="size-3 shrink-0 animate-spin" />
              ) : null}
              {chip.status === "ok" && chip.httpStatus != null ? (
                <span className="shrink-0 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  {chip.httpStatus}
                </span>
              ) : null}
              {chip.status === "error" && chip.httpStatus != null ? (
                <span className="shrink-0 font-mono text-[10px] text-destructive">
                  {chip.httpStatus}
                </span>
              ) : null}
              <span
                className="max-w-[14rem] truncate font-mono leading-snug sm:max-w-[20rem]"
                title={chip.message ? `${chip.url} — ${chip.message}` : chip.url}
              >
                {chip.url}
              </span>
              {chip.message && chip.status === "error" ? (
                <span className="max-w-[8rem] truncate text-[10px] text-destructive">
                  {chip.message}
                </span>
              ) : null}
              {!locked ? (
                <span className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    aria-label="Edit URL"
                    onClick={() => onStartEdit(chip)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-5"
                    aria-label="Remove URL"
                    onClick={() => onRemove(chip.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </span>
              ) : null}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
