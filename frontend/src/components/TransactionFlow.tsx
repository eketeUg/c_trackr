"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  MarkerType,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import CustomEdge from "./CustomEdge";
import CustomNode from "./CustomNode";

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

interface TransactionNode {
  id: string;
  label: string;
  type: "wallet" | "contract";
  data?: any;
}

interface TransactionEdge {
  source: string;
  target: string;
  label: string;
  type: "transfer" | "swap";
  tokenAddress?: string;
  data?: any;
}

interface MetaData {
  hash: string;
  timestamp: string;
  blockNumber: number;
  status: string;
}

interface TransactionFlowProps {
  data: {
    nodes: TransactionNode[];
    edges: TransactionEdge[];
    metadata: MetaData;
  } | null;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Always instantiate a new graph to prevent state issues
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configured to minimize crossings and maximize clarity
  dagreGraph.setGraph({
    rankdir: "LR",
    ranker: "network-simplex",
    acyclicer: "greedy",
    nodesep: 40, // Vertical spacing
    ranksep: 260, // Horizontal spacing for labels
    marginx: 50,
    marginy: 50,
  });

  // 1. Find Root Node (assume the first source node in edges that is never a target, or just the very first source)
  const targets = new Set(edges.map((e) => String(e.target)));
  let rootId =
    edges.length > 0
      ? edges.find((e) => !targets.has(String(e.source)))?.source ||
        edges[0].source
      : null;

  // Fallback if edges array is empty or root logic fails
  if (!rootId && nodes.length > 0) rootId = nodes[0].id;

  // 2. Perform Breadth-First Search to calculate Node Depth from Root
  const nodeDepth = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Build Adjacency List for BFS
  edges.forEach((edge) => {
    const src = String(edge.source);
    const tgt = String(edge.target);
    if (!adjacencyList.has(src)) adjacencyList.set(src, []);
    adjacencyList.get(src)!.push(tgt);
  });

  if (rootId) {
    const queue = [{ id: String(rootId), depth: 0 }];
    nodeDepth.set(String(rootId), 0);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const neighbors = adjacencyList.get(id) || [];

      for (const neighbor of neighbors) {
        if (!nodeDepth.has(neighbor)) {
          nodeDepth.set(neighbor, depth + 1);
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      }
    }
  }

  // Assign isolated nodes to depth 0
  nodes.forEach((n) => {
    if (!nodeDepth.has(n.id)) nodeDepth.set(n.id, 0);
  });

  // Track Multi-Edges (Duplicates between same src and tgt)
  const duplicateCounts = new Map<string, number>();
  
  // Track Divergent-Edges (Same source, different targets in the same layout pass)
  // This helps us fan out edges (like BaseSettler -> 5 different pools) so they don't perfectly overlap
  const divergentCounts = new Map<string, number>();

  // 3. Configure Dagre Nodes
  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: 200, height: 40 }),
  );

  // 4. Configure Dagre Edges (Only feed FORWARD chronological edges into Dagre)
  edges.forEach((edge) => {
    const src = String(edge.source);
    const tgt = String(edge.target);

    // Update Duplicate Tracking for this directional pair (Undirected matching)
    const pairKey = [src, tgt].sort().join('-');
    const count = (duplicateCounts.get(pairKey) || 0) + 1;
    duplicateCounts.set(pairKey, count);
    
    // Update Divergent Tracking for this source node
    const srcCount = (divergentCounts.get(src) || 0) + 1;
    divergentCounts.set(src, srcCount);

    // Set edge data duplicate/divergent index for later rendering offsets
    if (edge.data) {
      edge.data.duplicateIndex = count - 1; 
      edge.data.totalDuplicates = 1; // Will be updated in a second pass
      
      edge.data.divergentIndex = srcCount - 1;
      edge.data.totalDivergent = 1; // Will be updated in a second pass
    }

    const srcDepth = nodeDepth.get(src)!;
    const tgtDepth = nodeDepth.get(tgt)!;

    // To prevent Dagre from scrambling ranks due to cycles, we strictly only feed it edges that flow Forward or Parallel, but NEVER Backwards. 
    // Back-edges (Target depth is lower than Source depth) are ignored by Dagre, forcing it to keep chronological layout.
    if (tgtDepth >= srcDepth) {
      dagreGraph.setEdge(src, tgt, { weight: 1 });
    }
  });

  // Second pass: Update total duplicates and divergent counts on each edge
  edges.forEach((edge) => {
    const src = String(edge.source);
    const tgt = String(edge.target);
    const pairKey = [src, tgt].sort().join('-');
    
    if (edge.data) {
      edge.data.totalDuplicates = duplicateCounts.get(pairKey) || 1;
      edge.data.totalDivergent = divergentCounts.get(src) || 1;
    }
  });

  // 5. Execute Dagre layout
  dagre.layout(dagreGraph);

  const nodePositions: { [key: string]: { x: number; y: number } } = {};
  const layoutedNodes = nodes.map((node) => {
    const n = dagreGraph.node(node.id);
    const pos = { x: n.x - 100, y: n.y - 20 }; // Exact center for 200x40 pill
    nodePositions[node.id] = pos;
    return { ...node, position: pos };
  });

  // Track port usage to distribute connections
  const portUsage = new Map<string, { leftIn: number; rightOut: number }>();

  const getUsage = (id: string) => {
    if (!portUsage.has(id)) portUsage.set(id, { leftIn: 0, rightOut: 0 });
    return portUsage.get(id)!;
  };

  // Update edges with Multi-Port Vertical Routing
  const layoutedEdges = edges.map((edge, idx) => {
    // Determine flow direction
    const sourcePos = nodePositions[edge.source] || { x: 0 };
    const targetPos = nodePositions[edge.target] || { x: 0 };
    const isForward = targetPos.x >= sourcePos.x;

    const sourceUsage = getUsage(edge.source);
    const targetUsage = getUsage(edge.target);

    let sourceHandle = "";
    let targetHandle = "";

    // PRIORITY RULES:
    // Forward (A->B): Use A-Right (A/B/C) -> B-Left (A/B/C)
    // Backward (B->A): Use B-Left (Return) -> A-Right (Return)

    // STRICT FACE LOGIC:
    // Forward (A -> B): Source Right -> Target Left
    // Backward (B -> A/C -> B): Source Left -> Target Right

    if (isForward) {
      // 1. FORWARD FLOW (Right -> Left)

      // Source (Right Side - Outgoing)
      if (sourceUsage.rightOut === 0) {
        sourceHandle = "source-right-a";
        sourceUsage.rightOut++;
      } else if (sourceUsage.rightOut === 1) {
        sourceHandle = "source-right-b";
        sourceUsage.rightOut++;
      } else {
        sourceHandle = "source-right-c";
        sourceUsage.rightOut++;
      }

      // Target (Left Side - Incoming)
      if (targetUsage.leftIn === 0) {
        targetHandle = "target-left-a";
        targetUsage.leftIn++;
      } else if (targetUsage.leftIn === 1) {
        targetHandle = "target-left-b";
        targetUsage.leftIn++;
      } else {
        targetHandle = "target-left-c";
        targetUsage.leftIn++;
      }
    } else {
      // 2. BACKWARD FLOW (Left -> Right)
      // "from it left to thier right"

      sourceHandle = "source-left"; // Source Leaves from LEFT
      targetHandle = "target-right"; // Target Receives at RIGHT
    }

    const edgeColor = "#4b597c"; // Precise light steel blue/grey from MetaSleuth
    const isSwap = edge.data?.type === "swap" || edge.data?.kind === "swap";

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      type: "custom", // Use CustomEdge
      animated: false, // Turn off animation to match MetaSleuth
      style: {
        stroke: edgeColor,
        strokeWidth: 1.5, // Slightly thinner
        strokeDasharray: undefined, // Solid lines for everything like Metasleuth
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
      zIndex: isForward ? 1 : 10,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export default function TransactionFlow({ data }: TransactionFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!data) return;

    // --- SINGLE ENTITY MODEL (Schematic Flow) ---
    // 1. One Node per Address
    // 2. Edges represent flow between them
    // 3. Loops are allowed but styled as "Backward" schematic lines

    const rawNodes: Node[] = data.nodes.map((node) => ({
      id: node.id.toLowerCase(),
      type: "custom",
      position: { x: 0, y: 0 },
      data: {
        ...node.data,
        id: node.id.toLowerCase(),
        label: node.label,
        type: node.type,
      },
    }));

    const rawEdges: Edge[] = data.edges.map((edge, idx) => ({
      id: `e-${idx}`,
      source: String(edge.source).toLowerCase(),
      target: String(edge.target).toLowerCase(),
      data: edge.data,
    }));

    // Sort edges by step/serial
    const sortedEdges: Edge[] = rawEdges.slice().sort((a, b) => {
      const aSerial = Number(
        a.data?.step ?? a.data?.serial ?? parseInt(a.id.split("-")[1]) + 1,
      );
      const bSerial = Number(
        b.data?.step ?? b.data?.serial ?? parseInt(b.id.split("-")[1]) + 1,
      );
      return aSerial - bSerial;
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rawNodes,
      sortedEdges,
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: "100%", height: "100%", background: "transparent" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        nodesDraggable={true}
      >
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: 0, height: 0 }}
        >
          <defs>
            <linearGradient
              id="edge-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ef4444" /> {/* Red for Outgoing */}
              <stop offset="100%" stopColor="#22c55e" />{" "}
              {/* Green for Incoming */}
            </linearGradient>
          </defs>
        </svg>
        <Controls />
        <MiniMap style={{ background: "#111" }} nodeColor={() => "#333"} />
        <Background gap={24} size={1} color="#1f2233" />
      </ReactFlow>
    </div>
  );
}
