"use client";

import React, { useEffect, useRef } from "react";
import { graphviz } from "d3-graphviz";
import genDotStr, { FundFlowNode, FundFlowEdge, FundFlowRes } from "./MetaSleuthGraph/dot";
import { initNodes } from "./MetaSleuthGraph/graph";
import { NodeType } from "./MetaSleuthGraph/enum";

interface TransactionNode {
  id: string;
  label: string;
  type: "wallet" | "contract";
  data?: Record<string, unknown>;
}

interface TransactionEdge {
  source: string;
  target: string;
  label: string;
  type: "transfer" | "swap";
  tokenAddress?: string;
  selected?: boolean;
  from?: string;
  to?: string;
  data?: Record<string, unknown> & {
    selected?: boolean;
    tokenLabel?: string;
    tokenSymbol?: string;
    detail?: Array<{ date?: string }>;
    ts?: string;
    amount?: string | number;
    step?: number;
    serial?: number;
    type?: string;
    kind?: string;
    suspiciousFake?: boolean;
  };
}

interface MetaData {
  hash: string;
  timestamp: string;
  blockNumber: number;
  status: string;
  focusAddress?: string;
  focusNodeId?: string;
}

interface TransactionFlowProps {
  data: {
    nodes: TransactionNode[];
    edges: TransactionEdge[];
    metadata: MetaData;
  } | null;
}

const getPrimaryEndpoint = (edge: TransactionEdge, key: "source" | "target") => {
  if (edge?.[key]) return String(edge[key]).toLowerCase();
  if (key === "source" && edge?.from) return String(edge.from).toLowerCase();
  if (key === "target" && edge?.to) return String(edge.to).toLowerCase();
  return "";
};

const deriveFocusNodeId = (nodes: TransactionNode[], edges: TransactionEdge[], metadata?: MetaData) => {
  const fromMetadata =
    metadata?.focusAddress ??
    metadata?.focusNodeId ??
    (metadata?.hash?.startsWith("0x") && metadata.hash.length > 40 ? metadata.hash : "");
  if (fromMetadata) {
    const exact = nodes.find((node) => node.id.toLowerCase() === fromMetadata.toLowerCase());
    if (exact) return exact.id.toLowerCase();
  }

  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    const src = getPrimaryEndpoint(edge, "source");
    const tgt = getPrimaryEndpoint(edge, "target");
    degree.set(src, (degree.get(src) || 0) + 1);
    degree.set(tgt, (degree.get(tgt) || 0) + 1);
  });
  let best = "";
  let bestDegree = -1;
  degree.forEach((score, nodeId) => {
    if (score > bestDegree) {
      best = nodeId;
      bestDegree = score;
    }
  });
  return best;
};

export default function TransactionFlow({ data }: TransactionFlowProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;

    const rawEdges: TransactionEdge[] = data.edges.filter(
      (edge) => edge.selected === true || edge.data?.selected === true
    );
    const edgesToUse = rawEdges.length > 0 ? rawEdges : data.edges;

    const focusNodeId = deriveFocusNodeId(data.nodes, edgesToUse, data.metadata);

    const activeNodeIds = new Set<string>();
    edgesToUse.forEach(edge => {
      activeNodeIds.add(getPrimaryEndpoint(edge, "source"));
      activeNodeIds.add(getPrimaryEndpoint(edge, "target"));
    });

    const fundFlowNodes: FundFlowNode[] = data.nodes
      .filter((node) => activeNodeIds.has(node.id.toLowerCase()) || node.id.toLowerCase() === focusNodeId)
      .map((n) => ({
        id: n.id.toLowerCase(),
        address: n.id,
        label: n.label,
        type: NodeType.NORMAL,
        selected: true,
        chain: 'ethereum',
        color: n.id.toLowerCase() === focusNodeId ? '#b89a4f' : '#41454f',
      }));

    const fundFlowEdges: FundFlowEdge[] = edgesToUse
      .filter(e => getPrimaryEndpoint(e, "source") && getPrimaryEndpoint(e, "target"))
      .map(e => ({
        from: getPrimaryEndpoint(e, "source"),
        to: getPrimaryEndpoint(e, "target"),
        serial: Number(e.data?.step || e.data?.serial || 0),
        description: e.data?.amount ? String(e.data.amount) + (e.data.tokenSymbol ? ` ${e.data.tokenSymbol}` : '') : '',
        selected: true,
      }));

    const fundFlow: FundFlowRes = { nodes: fundFlowNodes, edges: fundFlowEdges };

    if (graphContainerRef.current) {
      try {
        graphviz(graphContainerRef.current)
          .options({
            zoom: true,
            fit: true,
            useWorker: false,
          })
          .on("end", () => {
            initNodes(fundFlow);
          })
          .renderDot(genDotStr(focusNodeId || "", fundFlow));
      } catch (e) {
        console.error("D3-Graphviz Error:", e);
      }
    }
  }, [data]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#1c1f26", overflow: "hidden" }}>
      <div id="graph0" ref={graphContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
