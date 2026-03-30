"use client";

import { useState, useMemo } from "react";
import { TreeNode, TreeNodeResolved } from "@/lib/types";
import { ChevronRight, Circle, Search } from "lucide-react";

interface Props {
  tree: TreeNode[];
  fileName: string;
  highlightedIds: string[];
}

/** Build a lookup map and resolve the flat API list into a nested tree.
 *  Root nodes are those whose node_id appears in the first item's `nodes`
 *  list OR nodes that are not referenced as children by any other node.
 */
function buildTree(flat: TreeNode[]): TreeNodeResolved[] {
  const map = new Map<string, TreeNodeResolved>();

  // First pass: create resolved nodes with empty children arrays
  for (const n of flat) {
    map.set(n.node_id, { ...n, nodes: [] });
  }

  // Second pass: populate children
  const childIds = new Set<string>();
  for (const n of flat) {
    const resolved = map.get(n.node_id)!;
    for (const childId of n.nodes) {
      const child = map.get(childId);
      if (child) {
        resolved.nodes.push(child);
        childIds.add(childId);
      }
    }
  }

  // ── Cycle detection ─────────────────────────────────────────────
  // Run a DFS tracking visiting/visited state. A back-edge to a node
  // currently in the visiting set means we found a cycle.
  type VisitState = "unvisited" | "visiting" | "visited";
  const state = new Map<string, VisitState>();
  map.forEach((_, id) => state.set(id, "unvisited"));

  function dfs(nodeId: string): void {
    state.set(nodeId, "visiting");
    const node = map.get(nodeId)!;
    for (const child of node.nodes) {
      const childState = state.get(child.node_id);
      if (childState === "visiting") {
        throw new Error(
          `buildTree: cycle detected — node "${child.node_id}" is its own ancestor.`
        );
      }
      if (childState === "unvisited") dfs(child.node_id);
    }
    state.set(nodeId, "visited");
  }

  for (const [id, s] of state.entries()) {
    if (s === "unvisited") dfs(id);
  }
  // ── End cycle detection ─────────────────────────────────────────

  // Roots = nodes not referenced as a child
  return flat
    .map(n => map.get(n.node_id)!)
    .filter(n => !childIds.has(n.node_id));
}

function TreeNodeRow({
  node,
  depth,
  highlightedIdSet,
}: {
  node: TreeNodeResolved;
  depth: number;
  highlightedIdSet: Set<string>;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isHighlighted = highlightedIdSet.has(node.node_id);
  const hasChildren = node.nodes.length > 0;
  const pageSpan =
    node.start_index === node.end_index
      ? `p.${node.start_index}`
      : `pp.${node.start_index}–${node.end_index}`;

  return (
    <div style={{ animation: "float-in 0.25s var(--ease) both" }}>
      {/* Semantic button wrapper — enables keyboard toggle and exposes state */}
      <button
        onClick={() => hasChildren && setOpen(o => !o)}
        aria-expanded={hasChildren ? open : undefined}
        onKeyDown={(e) => {
          if (!hasChildren) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(o => !o);
          }
        }}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          padding: 0,
          cursor: hasChildren ? "pointer" : "default",
        }}
      >
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: "8px",
          padding: `7px 10px 7px ${10 + depth * 16}px`,
          borderRadius: "var(--radius-md)",
          background: isHighlighted ? "var(--amber-dim)" : "transparent",
          border: `1px solid ${isHighlighted ? "rgba(246,201,14,0.25)" : "transparent"}`,
          transition: "all 0.18s var(--ease)",
          marginBottom: "2px",
          boxShadow: isHighlighted ? "0 0 12px rgba(246,201,14,0.08)" : "none",
        }}
        onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={e => { if (!isHighlighted) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Chevron / dot */}
        <span style={{ marginTop: "3px", flexShrink: 0, width: "14px", color: isHighlighted ? "var(--amber)" : "var(--text-3)" }}>
          {hasChildren ? (
            <ChevronRight 
              size={12} 
              strokeWidth={2.5} 
              style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s var(--ease)", color: isHighlighted ? "var(--amber)" : "var(--text-3)" }} 
            />
          ) : (
            <Circle 
              size={5} 
              style={{ color: isHighlighted ? "var(--amber)" : "var(--border-md)", margin: "4px 4.5px" }} 
            />
          )}
        </span>

        {/* Content */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "13px",
              fontWeight: hasChildren ? 600 : 400,
              color: isHighlighted ? "var(--amber)" : "var(--text-1)",
              letterSpacing: "-0.01em",
            }}>
              {node.title}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px", flexShrink: 0,
              color: isHighlighted ? "var(--amber)" : "var(--text-3)",
              background: isHighlighted ? "var(--amber-dim)" : "var(--surface-2)",
              border: `1px solid ${isHighlighted ? "rgba(246,201,14,0.25)" : "var(--border)"}`,
              padding: "1px 6px", borderRadius: "4px",
            }}>
              {pageSpan}
            </span>
            {isHighlighted && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 600,
                background: "var(--amber)", color: "#1a1200",
                padding: "1px 7px", borderRadius: "20px", letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                retrieved
              </span>
            )}
          </div>
          {node.summary && (
            <p style={{
              margin: "3px 0 0",
              fontSize: "11px",
              color: isHighlighted ? "rgba(246,201,14,0.7)" : "var(--text-3)",
              lineHeight: 1.5,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {node.summary}
            </p>
          )}
        </div>
      </div>
      </button>

      {/* Children — rendered outside the toggle button */}
      {open && hasChildren && (
        <div style={{
          borderLeft: `1px solid ${isHighlighted ? "rgba(246,201,14,0.2)" : "var(--border)"}`,
          marginLeft: `${22 + depth * 16}px`,
          paddingLeft: "4px",
        }}>
          {node.nodes.map((child, i) => (
            <TreeNodeRow key={child.node_id ?? i} node={child} depth={depth + 1} highlightedIdSet={highlightedIdSet} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeViewer({ tree, fileName, highlightedIds }: Props) {
  let resolvedRoots: TreeNodeResolved[];
  try {
    resolvedRoots = buildTree(tree);
  } catch (err) {
    console.error("TreeViewer: buildTree failed —", err);
    return (
      <div style={{ padding: "24px 16px", color: "var(--red)", fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.6 }}>
        Invalid tree structure detected. Please re-upload the document.
      </div>
    );
  }

  const highlightedIdSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);

  const totalNodes = (nodes: TreeNodeResolved[]): number =>
    nodes.reduce((acc, n) => acc + 1 + totalNodes(n.nodes), 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      boxShadow: "var(--shadow-md)",
    }}>
      {/* Header */}
      <div style={{
        padding: "13px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
            Document Tree
          </p>
          <p style={{
            margin: 0, fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)",
            maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {fileName}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {highlightedIds.length > 0 && (
            <span className="badge badge-amber">
              {highlightedIds.length} retrieved
            </span>
          )}
          <span className="badge badge-default">
            {totalNodes(resolvedRoots)} nodes
          </span>
        </div>
      </div>

      {/* Tree body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {resolvedRoots.map((node, i) => (
          <TreeNodeRow key={node.node_id ?? i} node={node} depth={0} highlightedIdSet={highlightedIdSet} />
        ))}
      </div>

      {/* Retrieved footer */}
      {highlightedIds.length > 0 && (
        <div style={{
          padding: "9px 16px",
          borderTop: "1px solid rgba(246,201,14,0.2)",
          background: "var(--amber-dim)",
          display: "flex", alignItems: "center", gap: "7px",
        }}>
          <Search size={11} stroke="var(--amber)" strokeWidth={2.5} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--amber)", fontWeight: 500, letterSpacing: "0.04em" }}>
            {highlightedIds.length} NODE{highlightedIds.length !== 1 ? "S" : ""} USED IN LAST ANSWER
          </span>
        </div>
      )}
    </div>
  );
}
