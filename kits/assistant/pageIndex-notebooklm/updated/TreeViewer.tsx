"use client";

import { useState } from "react";
import { TreeNode } from "@/lib/types";
import { ChevronRight, ChevronDown, BookOpen } from "lucide-react";
import clsx from "clsx";

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  highlightedIds?: string[];
}

function TreeNodeItem({ node, depth, highlightedIds = [] }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.nodes && node.nodes.length > 0;
  const isHighlighted = highlightedIds.includes(node.node_id);

  return (
    <div>
      <div
        className={clsx(
          "flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
          isHighlighted
            ? "bg-amber-50 border border-amber-200"
            : "hover:bg-gray-50"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="mt-0.5 shrink-0 w-4">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "text-sm font-medium leading-snug",
                isHighlighted ? "text-amber-800" : "text-gray-800"
              )}
            >
              {node.title}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              pp.{node.start_index}–{node.end_index}
            </span>
            {isHighlighted && (
              <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
                retrieved
              </span>
            )}
          </div>
          {node.summary && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
              {node.summary}
            </p>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.nodes!.map((child) => (
            <TreeNodeItem
              key={child.node_id}
              node={child}
              depth={depth + 1}
              highlightedIds={highlightedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  tree: TreeNode[];
  fileName: string;
  highlightedIds?: string[];
}

export default function TreeViewer({ tree, fileName, highlightedIds = [] }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <BookOpen className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-800 truncate">{fileName}</span>
        <span className="ml-auto text-xs text-gray-400">{tree.length} sections</span>
      </div>
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.node_id}
            node={node}
            depth={0}
            highlightedIds={highlightedIds}
          />
        ))}
      </div>
    </div>
  );
}
