"use client";

import React, { useCallback, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

interface TransactionNode {
    id: string;
    label: string;
    type: 'wallet' | 'contract';
}

interface TransactionEdge {
    source: string;
    target: string;
    label: string;
    type: 'native' | 'token';
    tokenAddress?: string;
}

interface MetaData {
    hash: string;
    timestamp: string;
    blockNumber: number;
    gasUsed: string;
    gasPrice: string;
    status: string;
}

interface TransactionFlowProps {
    data: {
        nodes: TransactionNode[];
        edges: TransactionEdge[];
        metadata: MetaData;
    } | null;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 300, nodesep: 100 }); // Left to Right layout, exploded

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 80 }); // Approx node dimensions
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Get initial positions from Dagre
  let newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110, // Center offset
        y: nodeWithPosition.y - 40,
      },
    };
  });

  // Apply staggered (zig-zag) layout if there are more than 2 nodes
  if (nodes.length > 2) {
    // Sort nodes by X position to apply staggering in order from left to right
    newNodes.sort((a, b) => a.position.x - b.position.x);

    newNodes = newNodes.map((node, index) => {
      // Skip the first and last node to keep start/end points aligned (optional, but good for flow)
      // Or just stagger everything. Let's stagger everything intermediate or everything.
      // User asked for "branchlike or alternating". Staggering all is simplest.
      const yOffset = index % 2 === 0 ? 75 : -75;
      return {
        ...node,
        position: {
          ...node.position,
          y: node.position.y + yOffset,
        },
      };
    });
  }

  return { nodes: newNodes, edges };
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function TransactionFlow({ data }: TransactionFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (data) {
        const rawNodes: Node[] = data.nodes.map((node) => ({
            id: node.id,
            position: { x: 0, y: 0 },
            type: 'custom',
            data: { 
                id: node.id, 
                label: node.label, 
                type: node.type 
            },
        }));

        const rawEdges: Edge[] = data.edges.map((edge, index) => ({
            id: `e-${index}`,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            animated: true,
            type: ConnectionLineType.SmoothStep, // Or Bezier
            style: { 
                stroke: edge.type === 'token' ? '#3b82f6' : '#f59e0b',
                strokeWidth: 2,
            },
            labelStyle: { fill: '#aaa', fontWeight: 700, fontSize: 10 },
            labelBgStyle: { fill: '#111', fillOpacity: 0.7 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edge.type === 'token' ? '#3b82f6' : '#f59e0b',
            },
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            rawNodes,
            rawEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: 'transparent' }}>
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        colorMode="dark"
      >
        <Controls />
        <MiniMap style={{ background: '#111' }} nodeColor={() => '#333'} />
        <Background gap={20} size={1} color="#222" />
      </ReactFlow>
    </div>
  );
}
