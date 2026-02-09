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
import CustomNode from "./CustomNode";

const nodeTypes = { custom: CustomNode };

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

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
) => {
  // Always instantiate a new graph to prevent state issues
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configured to minimize crossings and maximize clarity
  dagreGraph.setGraph({
    rankdir: "LR",
    ranker: "network-simplex", 
    acyclicer: "greedy", 
    nodesep: 100, // Balanced vertical spacing
    ranksep: 400, // Increased Horizontal spacing for Labels
    marginx: 50,
    marginy: 50,
  });

  // Identify the Start Node (Source of the first edge)
  const startNodeId = edges.length > 0 ? edges[0].source : null;

  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: 350, height: 150 }),
  );

  edges.forEach((edge) => {
    // Force the Start Node to be on the Left (Rank 0) by treating incoming edges as outgoing
    // If an edge targets the Start Node, reverse it for layout calculation so Start Node is "upstream"
    if (startNodeId && edge.target === startNodeId) {
      dagreGraph.setEdge(String(edge.target), String(edge.source));
    } else {
      dagreGraph.setEdge(String(edge.source), String(edge.target));
    }
  });

  dagre.layout(dagreGraph);

  const nodePositions: { [key: string]: { x: number; y: number } } = {};
  const layoutedNodes = nodes.map((node) => {
    const n = dagreGraph.node(node.id);
    const pos = { x: n.x - 175, y: n.y - 75 };
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

    const edgeColor = isForward ? "#4f46e5" : "#ef4444";
    const amount = edge.data?.amount ?? edge.data?.value ?? "";
    const tokenSym = edge.data?.tokenSymbol ?? edge.data?.token ?? "";
    const ts = edge.data?.timestamp
      ? String(edge.data.timestamp).replace("T", " ")
      : edge.data?.time || "";
    
    const stepIndex = edge.data?.step ?? edge.data?.serial ?? idx + 1;

    let label = "";
    if (amount && tokenSym) {
       label = `[${stepIndex}] [${ts}] ${amount} ${tokenSym}`;
    } else {
       const existingLabel = typeof edge.label === 'string' ? edge.label : String(edge.label || '');
       const description = edge.data?.description ? String(edge.data.description) : "";
       label = existingLabel || description || `[${stepIndex}] Interaction`;
    }

    const isSwap = edge.data?.type === "swap" || edge.data?.kind === "swap";

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      // Reverting to Consistent Bezier Layout (User preference for clarity)
      type: ConnectionLineType.Bezier,
      animated: true,
      style: {
        stroke: edgeColor, 
        strokeWidth: 2,
        strokeDasharray: isSwap ? "6 4" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
      label: label,
      labelStyle: { fill: "#eee", fontWeight: 500, fontSize: 11, fontFamily: "monospace" },
      labelBgStyle: { fill: "#111", fillOpacity: 0.8, rx: 4, ry: 4 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
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
      data: { ...node.data, id: node.id.toLowerCase(), label: node.label, type: node.type },
    }));

    const rawEdges: Edge[] = data.edges.map((edge, idx) => ({
      id: `e-${idx}`,
      source: String(edge.source).toLowerCase(),
      target: String(edge.target).toLowerCase(),
      type: ConnectionLineType.SmoothStep, // ALWAYS SmoothStep for Schematic/Circuit look
      data: edge.data,
    }));

    // Sort edges by step/serial
    const sortedEdges: Edge[] = rawEdges.slice().sort((a, b) => {
      const aSerial = Number(
        a.data?.serial ?? a.data?.order ?? parseInt(a.id.split("-")[1]) + 1,
      );
      const bSerial = Number(
        b.data?.serial ?? b.data?.order ?? parseInt(b.id.split("-")[1]) + 1,
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
        fitView
        minZoom={0.1}
        nodesDraggable={true}
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" /> {/* Red for Outgoing */}
              <stop offset="100%" stopColor="#22c55e" /> {/* Green for Incoming */}
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
