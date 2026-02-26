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
    nodesep: 20, // Tighter vertical spacing for pill nodes
    ranksep: 100, // Reduced Horizontal spacing for compactness like Metasleuth
    marginx: 50,
    marginy: 50,
  });

  // 1. Identify Start Node
  const startNodeId = edges.length > 0 ? edges[0].source : null;

  // 2. Assign Ranks based on "First Appearance" in Step Order
  const nodeRanks = new Map<string, number>();
  const visited = new Set<string>();

  // Sort edges strictly by step to simulate time flow
  const timeSortedEdges = [...edges].sort((a, b) => {
    const aSerial = Number(a.data?.step ?? a.data?.serial ?? 0);
    const bSerial = Number(b.data?.step ?? b.data?.serial ?? 0);
    return aSerial - bSerial;
  });

  if (startNodeId) {
    nodeRanks.set(startNodeId, 0);
    visited.add(startNodeId);
  }

  // Assign ranks: Child Rank = Parent Rank + 1 (if not visited)
  timeSortedEdges.forEach((edge) => {
    const sourceRank = nodeRanks.get(edge.source) ?? 0;

    if (!visited.has(edge.target)) {
      nodeRanks.set(edge.target, sourceRank + 1);
      visited.add(edge.target);
    }
  });

  // 3. Configure Dagre Graph
  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: 220, height: 60 }),
  );

  edges.forEach((edge) => {
    const sourceRank = nodeRanks.get(edge.source) ?? 0;
    const targetRank = nodeRanks.get(edge.target) ?? 0;
    const isForward = sourceRank < targetRank;

    // Enforce high weight for Forward Flow (Time)
    // Low weight for Back/Cross Flow
    dagreGraph.setEdge(String(edge.source), String(edge.target), {
      weight: isForward ? 100 : 1,
      minlen: isForward ? targetRank - sourceRank : 1,
    });
  });

  dagre.layout(dagreGraph);

  const nodePositions: { [key: string]: { x: number; y: number } } = {};
  const layoutedNodes = nodes.map((node) => {
    const n = dagreGraph.node(node.id);
    const pos = { x: n.x - 110, y: n.y - 30 }; // Center anchor based on new width/height
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

    const edgeColor = "#60a5fa"; // Always Blue-400 for uniform look
    const isSwap = edge.data?.type === "swap" || edge.data?.kind === "swap";

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      // Reverting to Consistent Bezier Layout (User preference for clarity)
      type: "custom", // Use CustomEdge
      animated: true,
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
        <Background gap={20} size={1} color="#222" />
      </ReactFlow>
    </div>
  );
}
