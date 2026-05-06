'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { graphviz } from 'd3-graphviz';
import { 
  sortEdgesMetaSleuthRaw, 
  generateMetaSleuthDot,
  codeHTMLEntities 
} from '../lib/metasleuthLayout';
import { getAddressFlow } from '../lib/api';

export interface TransactionNode {
  id: string;
  address?: string;
  isContract?: boolean;
  label?: string;
  type?: string;
  image?: string;
  logo?: string;
}

export interface TransactionEdge {
  source: string;
  target: string;
  from?: string;
  to?: string;
  fromAddress?: string;
  toAddress?: string;
  tokenAddress?: string;
  label?: string;
  type?: string;
  selected?: boolean;
  data?: any;
}

interface TransactionFlowProps {
  data: {
    nodes: TransactionNode[];
    edges: TransactionEdge[];
    metadata?: {
      hash?: string;
      status?: string;
      blockNumber?: number;
      gasUsed?: string;
      timestamp?: string;
    };
  };
  targetAddress: string;
  chain?: string;
}

import { createRoot } from 'react-dom/client';
import CustomNode from './CustomNode';

interface EdgeTooltip {
  x: number;
  y: number;
  txHash: string;
  label: string;
  edgeId: string;
}

const TransactionFlow: React.FC<TransactionFlowProps> = ({ data, targetAddress, chain = 'ethereum' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rootsRef = useRef<any[]>([]);
  const [edgeTooltip, setEdgeTooltip] = useState<EdgeTooltip | null>(null);
  const [copied, setCopied] = useState(false);
  const activeEdgeRef = useRef<string | null>(null);
  const engineEdgesRef = useRef<any[]>([]);

  // Consolidated state for graph data and expansion tracking
  const [graphState, setGraphState] = useState<{
    nodes: TransactionNode[];
    edges: TransactionEdge[];
    expandedCount: number;
  }>({ 
    nodes: data.nodes, 
    edges: data.edges,
    expandedCount: 0 
  });

  // Use refs for analysis UI state so they don't trigger graph re-renders
  const expandedAddressesRef = useRef<Set<string>>(new Set());
  const analysingAddressRef = useRef<string | null>(null);

  const mainTxHash = data.metadata?.hash || '';

  // Reset merged data when the initial data changes (new search)
  useEffect(() => {
    setGraphState({ 
      nodes: data.nodes, 
      edges: data.edges,
      expandedCount: 0 
    });
    expandedAddressesRef.current = new Set();
    analysingAddressRef.current = null;
  }, [data]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // Handle node analyse — fetch address flow and merge
  const handleAnalyse = useCallback(async (address: string) => {
    if (expandedAddressesRef.current.has(address.toLowerCase()) || analysingAddressRef.current) return;

    analysingAddressRef.current = address;

    try {
      const result = await getAddressFlow(chain, address);

      if (result && result.nodes && result.edges) {
        expandedAddressesRef.current.add(address.toLowerCase());

        setGraphState(prev => {
          const existingNodeIds = new Set(prev.nodes.map(n => n.id));
          const existingEdgeKeys = new Set(
            prev.edges.map(e => `${e.source}-${e.target}-${e.label || ''}`)
          );

          const newNodes = result.nodes.filter(
            (n: TransactionNode) => !existingNodeIds.has(n.id)
          );

          const newEdges = result.edges.filter((e: TransactionEdge) => {
            const key = `${e.source}-${e.target}-${e.label || ''}`;
            return !existingEdgeKeys.has(key);
          });

          return {
            nodes: [...prev.nodes, ...newNodes],
            edges: [...prev.edges, ...newEdges],
            expandedCount: expandedAddressesRef.current.size
          };
        });
      }
    } catch (error) {
      console.error('Failed to analyse address:', error);
    } finally {
      analysingAddressRef.current = null;
    }
  }, [chain]);

  // Dismiss tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-edge-tooltip]')) return;
      if (target.closest('.edge')) return;
      
      setEdgeTooltip(null);
      if (activeEdgeRef.current) {
        d3.selectAll('.edge').each(function () {
          const edge = d3.select(this);
          edge.classed('edge-highlighted', false);
          edge.select('path:not(.edge-hitarea)').attr('stroke-width', '2').style('filter', null);
        });
        activeEdgeRef.current = null;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main render effect — triggers whenever mergedData changes
  useEffect(() => {
    if (!graphState || !graphState.nodes || !containerRef.current) return;

    const renderGraph = async () => {
      // Capture and defer cleanup of previous roots to avoid React race condition
      const oldRoots = [...rootsRef.current];
      rootsRef.current = [];
      setTimeout(() => {
        oldRoots.forEach(root => root.unmount());
      }, 0);

      setIsLoading(true);
      setEdgeTooltip(null);
      activeEdgeRef.current = null;

      // Clear previous Graphviz SVG to prevent conflicts
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        const engineEdges = graphState.edges.map((e, index) => ({
          ...e,
          from: (e.source || e.fromAddress || '').toString().trim(),
          to: (e.target || e.toAddress || '').toString().trim(),
          id: `e-${index}`,
          selected: e.selected !== false
        }));
        engineEdgesRef.current = engineEdges;

        const dot = generateMetaSleuthDot(targetAddress, { nodes: graphState.nodes, edges: engineEdges });

        const gv = graphviz(containerRef.current!)
          .options({
            useWorker: false,
            width: containerRef.current!.clientWidth,
            height: containerRef.current!.clientHeight || 800,
            fit: true,
            zoom: true,
          })
          .transition(() => (d3.transition() as any).duration(0)) // Disable transitions for faster/reliable updates
          .renderDot(dot)
          .on('end', () => {
            setIsLoading(false);
            applyMetaSleuthInteractivity();
          });

      } catch (error) {
        console.error('Graphviz Render Error:', error);
        setIsLoading(false);
      }
    };

    const applyMetaSleuthInteractivity = () => {
      const svg = d3.select(containerRef.current).select('svg');
      if (svg.empty()) return;

      svg.attr('width', '100%').attr('height', '100%');

      // MetaSleuth Style: Dark Background
      svg.style('background', '#16181D');
      
      // Hide the default white polygon background generated by Graphviz
      svg.select('polygon').attr('fill', '#16181D').attr('stroke', 'transparent');

      // Inject Custom React Nodes via foreignObject
      const nodes = svg.selectAll('g.node');
      console.log('Detected node groups for injection:', nodes.size());

      nodes.each(function() {
        const node = d3.select(this);
        const nodeId = node.select('title').text().trim();
        
        // Robust node lookup: try ID match, then address match
        let nodeData = graphState.nodes.find(n => n.id === nodeId);
        if (!nodeData) {
          // Try matching by address field (MetaSleuth IDs can differ)
          nodeData = graphState.nodes.find(n => 
            (n.address && n.address.toLowerCase() === nodeId.toLowerCase()) ||
            ((n as any).data?.address && (n as any).data.address.toLowerCase() === nodeId.toLowerCase())
          );
        }
        if (!nodeData) {
          // Try partial match (MetaSleuth IDs like "1-0xabc..." contain the address after "-")
          const strippedId = nodeId.includes('-') ? nodeId.substring(nodeId.indexOf('-') + 1) : nodeId;
          nodeData = graphState.nodes.find(n => {
            const nAddr = n.address || (n as any).data?.address || '';
            return nAddr.toLowerCase() === strippedId.toLowerCase();
          });
        }

        // Hide the default Graphviz rectangle/text for all nodes
        node.selectAll('polygon, rect, path, text, ellipse').style('opacity', '0').style('pointer-events', 'none');
        
        if (!nodeData) return;

        const bbox = (this as SVGGElement).getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;

        // Check if foreignObject already exists to avoid duplicates
        if (!node.select('foreignObject').empty()) return;

        const width = 380;
        const height = 100;

        const fo = node.append('foreignObject')
          .attr('width', width)
          .attr('height', height + 80) // Extra space for dropdown
          .attr('x', cx - width / 2)
          .attr('y', cy - height / 2)
          .style('pointer-events', 'all')
          .style('overflow', 'visible');

        const div = fo.append('xhtml:div')
          .style('width', `${width}px`)
          .style('height', `${height}px`)
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center');

        // Determine the address for this node — prefer top-level, then data.address, then nodeId
        const nodeAddress = nodeData.address || 
                           (nodeData as any).data?.address || 
                           nodeId;
        const cleanAddress = nodeAddress.includes('-') 
          ? nodeAddress.substring(nodeAddress.indexOf('-') + 1) 
          : nodeAddress;
        const isExpanded = expandedAddressesRef.current.has(cleanAddress.toLowerCase());
        const isCurrentlyAnalysing = analysingAddressRef.current?.toLowerCase() === cleanAddress.toLowerCase();

        const root = createRoot(div.node() as HTMLElement);
        root.render(
          <div className="w-[380px] h-[100px] flex items-center justify-center">
             <CustomNode 
                data={{
                  address: nodeAddress,
                  label: nodeData.label || '',
                  logo: nodeData.image || nodeData.logo,
                  chain: chain,
                  isTarget: cleanAddress.toLowerCase().includes(targetAddress.toLowerCase()) || nodeId.toLowerCase().includes(targetAddress.toLowerCase()),
                  isExpanded: isExpanded,
                }}
                onAnalyse={handleAnalyse}
                isAnalysing={isCurrentlyAnalysing}
             />
          </div>
        );
        rootsRef.current.push(root);
      });

      // Style Edges + Add click interaction
      d3.selectAll('.edge').each(function() {
        const edge = d3.select(this);
        const path = edge.select('path');
        
        path.attr('stroke-width', '2');
        
        edge.selectAll('text').attr('fill', '#FFFFFF').style('font-family', 'Inter, sans-serif');

        edge.style('cursor', 'pointer');

        // Thicken the clickable area with an invisible wider path
        const pathD = path.attr('d');
        if (pathD && edge.select('.edge-hitarea').empty()) {
          edge.insert('path', ':first-child')
            .attr('d', pathD)
            .attr('stroke', 'transparent')
            .attr('stroke-width', '16')
            .attr('fill', 'none')
            .attr('class', 'edge-hitarea');
        }

        edge.on('click', function(event: MouseEvent) {
          event.stopPropagation();
          const edgeId = d3.select(this).attr('id');
          
          // Toggle: clicking the same edge again dismisses
          if (activeEdgeRef.current === edgeId) {
            d3.selectAll('.edge').each(function() {
              d3.select(this).classed('edge-highlighted', false);
              d3.select(this).select('path:not(.edge-hitarea)').attr('stroke-width', '2').style('filter', null);
            });
            activeEdgeRef.current = null;
            setEdgeTooltip(null);
            return;
          }

          // Reset all edges
          d3.selectAll('.edge').each(function() {
            d3.select(this).classed('edge-highlighted', false);
            d3.select(this).select('path:not(.edge-hitarea)').attr('stroke-width', '2').style('filter', null);
          });

          // Highlight clicked edge
          const clickedEdge = d3.select(this);
          clickedEdge.classed('edge-highlighted', true);
          const clickedPath = clickedEdge.select('path:not(.edge-hitarea)');
          clickedPath.attr('stroke-width', '4');
          const edgeColor = clickedPath.attr('stroke') || '#FFFFFF';
          clickedPath.style('filter', `drop-shadow(0 0 6px ${edgeColor})`);
          activeEdgeRef.current = edgeId;

          // Look up the original edge data
          const edgeData = engineEdgesRef.current.find((e: any) => e.id === edgeId);
          const txHash = edgeData?.data?.txHash || mainTxHash;
          const label = edgeData?.data?.description || edgeData?.label || '';

          const containerRect = containerRef.current!.getBoundingClientRect();
          const tooltipX = event.clientX - containerRect.left;
          const tooltipY = event.clientY - containerRect.top;

          setEdgeTooltip({
            x: tooltipX,
            y: tooltipY,
            txHash,
            label,
            edgeId: edgeId || '',
          });
          setCopied(false);
        });
      });

      // Raise all edges above nodes so arrowheads are never blocked by node overlays
      svg.selectAll('g.edge').raise();
    };

    renderGraph();

    return () => {
      // Cleanup on effect re-run or unmount
      rootsRef.current.forEach(root => {
        setTimeout(() => root.unmount(), 0);
      });
      rootsRef.current = [];
    };
  }, [graphState, targetAddress, chain, mainTxHash]);

  return (
    <div className="relative w-full h-full min-h-[800px] bg-[#16181D] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#16181D]/80">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div 
        ref={containerRef} 
        id="graph" 
        className="w-full h-full pt-20"
        style={{ cursor: 'grab' }}
      />

      {/* Expansion indicator */}
      {graphState.expandedCount > 0 && (
        <div className="absolute top-4 right-4 z-40 bg-[#1E2028]/90 border border-gray-700/50 rounded-lg px-3 py-2 backdrop-blur-sm">
          <span className="text-emerald-400 text-xs font-medium">
            ✦ {graphState.expandedCount} node{graphState.expandedCount > 1 ? 's' : ''} expanded
          </span>
        </div>
      )}

      {/* Edge Tooltip */}
      {edgeTooltip && (
        <div
          data-edge-tooltip
          className="absolute z-[60] animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: edgeTooltip.x,
            top: edgeTooltip.y - 12,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-[#1E2028] border border-gray-700/60 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl px-4 py-3 min-w-[320px] max-w-[420px]">
            {/* Arrow pointing down */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[6px] w-3 h-3 bg-[#1E2028] border-r border-b border-gray-700/60 rotate-45"
            />

            {/* Label */}
            {edgeTooltip.label && (
              <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-2 font-medium">
                Transfer Details
              </div>
            )}

            {/* Description */}
            {edgeTooltip.label && (
              <div className="text-gray-200 text-sm mb-3 leading-relaxed">
                {edgeTooltip.label}
              </div>
            )}

            {/* Transaction Hash */}
            <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-1.5 font-medium">
              Transaction Hash
            </div>
            <div className="flex items-center gap-2 bg-[#16181D] rounded-lg px-3 py-2 border border-gray-800/50 group">
              <code className="text-[12px] text-emerald-400 font-mono flex-1 truncate select-all">
                {edgeTooltip.txHash}
              </code>
              <button
                onClick={() => handleCopy(edgeTooltip.txHash)}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-gray-700/50 transition-all duration-200 active:scale-90"
                title="Copy transaction hash"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFlow;
