"use client";

import { useState } from "react";
import { TreeNode } from "@/lib/types";

interface Props {
  tree: TreeNode[];
  fileName: string;
  highlightedIds: string[];
}

function TreeNodeRow({ node, depth, highlightedIds }: { node: TreeNode; depth: number; highlightedIds: string[] }) {
  const [open, setOpen] = useState(depth < 2);
  const isHighlighted = highlightedIds.includes(node.node_id);
  const hasChildren = node.nodes && node.nodes.length > 0;
  const pageSpan = node.start_index === node.end_index
    ? `p.${node.start_index}`
    : `pp.${node.start_index}–${node.end_index}`;

  return (
    <div>
      <div
        onClick={() => hasChildren && setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "flex-start", gap: "8px",
          padding: `7px 10px 7px ${10 + depth * 18}px`,
          borderRadius: "8px",
          cursor: hasChildren ? "pointer" : "default",
          background: isHighlighted ? "var(--amber-dim)" : "transparent",
          border: isHighlighted ? "1px solid rgba(245,158,11,0.3)" : "1px solid transparent",
          transition: "background 0.15s",
          marginBottom: "2px",
        }}
        onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={e => { if (!isHighlighted) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Expand/collapse icon */}
        <span style={{ marginTop: "3px", flexShrink: 0, width: "14px", color: "var(--text-muted)" }}>
          {hasChildren ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ opacity: 0.3, marginTop: "3px" }}>
              <circle cx="12" cy="12" r="6"/>
            </svg>
          )}
        </span>

        {/* Content */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "13px",
              fontWeight: hasChildren ? 600 : 400,
              color: isHighlighted ? "var(--amber)" : "var(--text-primary)",
            }}>
              {node.title}
            </span>
            <span style={{
              fontSize: "10px", flexShrink: 0,
              color: isHighlighted ? "var(--amber)" : "var(--text-muted)",
              background: isHighlighted ? "var(--amber-dim)" : "var(--surface-2)",
              border: `1px solid ${isHighlighted ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
              padding: "1px 5px", borderRadius: "4px",
            }}>
              {pageSpan}
            </span>
            {isHighlighted && (
              <span style={{ fontSize: "10px", background: "var(--amber)", color: "#000", padding: "1px 6px", borderRadius: "20px", fontWeight: 700, flexShrink: 0 }}>
                retrieved
              </span>
            )}
          </div>
          {/* Summary — the key new field from updated workflow */}
          {node.summary && (
            <p style={{
              margin: "3px 0 0",
              fontSize: "11px", color: isHighlighted ? "rgba(245,158,11,0.8)" : "var(--text-muted)",
              lineHeight: 1.5,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {node.summary}
            </p>
          )}
        </div>
      </div>

      {open && hasChildren && node.nodes!.map(child => (
        <TreeNodeRow key={child.node_id} node={child} depth={depth + 1} highlightedIds={highlightedIds} />
      ))}
    </div>
  );
}

export default function TreeViewer({ tree, fileName, highlightedIds }: Props) {
  const totalNodes = (nodes: TreeNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + totalNodes(n.nodes || []), 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "12px", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Document Tree</p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {highlightedIds.length > 0 && (
            <span style={{ fontSize: "11px", color: "var(--amber)", background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,0.3)", padding: "3px 8px", borderRadius: "6px", fontWeight: 500 }}>
              {highlightedIds.length} retrieved
            </span>
          )}
          <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: "6px" }}>
            {totalNodes(tree)} nodes
          </span>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {tree.map(node => (
          <TreeNodeRow key={node.node_id} node={node} depth={0} highlightedIds={highlightedIds} />
        ))}
      </div>

      {/* Retrieved footer */}
      {highlightedIds.length > 0 && (
        <div style={{
          padding: "8px 16px", borderTop: "1px solid rgba(245,158,11,0.2)",
          background: "var(--amber-dim)", fontSize: "11px", color: "var(--amber)",
          fontWeight: 500, display: "flex", alignItems: "center", gap: "6px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          {highlightedIds.length} node{highlightedIds.length !== 1 ? "s" : ""} used in last answer — highlighted above
        </div>
      )}
    </div>
  );
}
