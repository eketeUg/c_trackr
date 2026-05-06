import { graphviz } from 'd3-graphviz';
import * as d3 from 'd3';

// Simplified utility helpers ported from MetaSleuth or implemented for our needs
const decodeUnicode = (str: string) => {
  try {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) {
    return str;
  }
};

export const codeHTMLEntities = (str: string) => {
  return str.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`);
};

const getContrastColor = (hex: string) => {
  if (!hex || hex === 'transparent') return '#000000';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

/**
 * EXACT port of MetaSleuth's swapItem utility
 */
const swapItem = <T>(arr: T[], idx1: number, idx2: number): T[] => {
  const res = [...arr];
  [res[idx1], res[idx2]] = [res[idx2], res[idx1]];
  return res;
};

/**
 * EXACT port of MetaSleuth's edge sorting logic
 */
export const sortEdgesMetaSleuthRaw = (edges: any[]) => {

  const groupMap = edges.reduce((acc: Record<string, any[]>, item) => {
    const key = `${item.from}-${item.to}`;
    const keyReverse = `${item.to}-${item.from}`;
    if (acc[key]) {
      acc[key].push(item);
    } else if (acc[keyReverse]) {
      acc[keyReverse].push(item);
    } else {
      acc[key] = [item];
    }
    return acc;
  }, {});

  const result: any[] = [];
  for (const key in groupMap) {
    let arr = groupMap[key];
    const [from, to] = key.split('-');
    const temp = arr.filter(item => item.from === from && item.to === to);
    if (temp.length < Math.ceil(arr.length / 2)) {
      const sourceIdx = arr.findIndex(
        item => item.to === from && item.from === to
      );
      if (sourceIdx !== -1) {
        arr = swapItem<any>(arr, sourceIdx, 0);
      }
    }
    result.push(...arr);
  }
  return result;
};

/**
 * Ported MetaSleuth DOT generation - EXACT logic match with dot.ts
 */
export const generateMetaSleuthDot = (mainAddress: string, data: { nodes: any[], edges: any[] }) => {

  const sortedEdges = sortEdgesMetaSleuthRaw(data.edges).filter(edge => edge.selected);
  const addressMap = new Map<string, any>();
  
  data.nodes.forEach(item => {
    addressMap.set(item.id, item);
  });

  const mainAddressNode = data.nodes.find(
    item => (item.address || '').toLowerCase() === mainAddress.toLowerCase()
  );
  const mainAddressId = mainAddressNode?.id || mainAddress;
  const targetAddressRaw = mainAddress.toLowerCase();

  let dot = `digraph "" {
    rankdir="LR"
    bgcolor="#16181D"
    nodesep=1.5
    ranksep=2.5
    pad="0.5,1.5"
    node [style="filled", fontname="Inter,Poppins-Regular"]
    edge [arrowhead="vee", arrowsize="0.75", fontname="Inter,Poppins-Regular"]
  `;

  const seenNodesInDot = new Set<string>();

  const genNodeDot = (node: any) => {
    const { id } = node;
    // Use a visible but high-contrast shape to ensure Graphviz creates the group and transform
    return `  "${id}" [
      shape="rect"
      style="filled"
      fillcolor="#16181D"
      color="#333"
      fixedsize="true"
      width="4.0"
      height="1.0"
      label=""
    ]\n`;
  };

  // 1. Ensure the main address node is always included
  if (mainAddressNode && !seenNodesInDot.has(mainAddressId)) {
    dot += genNodeDot(mainAddressNode);
    seenNodesInDot.add(mainAddressId);
  }

  // 2. Discover nodes from edges
  sortedEdges.forEach(item => {
    const fromNode = addressMap.get(item.from);
    const toNode = addressMap.get(item.to);
    
    if (fromNode && !seenNodesInDot.has(fromNode.id)) {
      dot += genNodeDot(fromNode);
      seenNodesInDot.add(fromNode.id);
    }
    if (toNode && !seenNodesInDot.has(toNode.id)) {
      dot += genNodeDot(toNode);
      seenNodesInDot.add(toNode.id);
    }
  });

  // 3. Add edges with extremely robust mapping
  sortedEdges.forEach((item) => {
    // Robust check for Output vs Input
    const fromNode = addressMap.get(item.from);
    const fromAddress = (fromNode?.address || '').toLowerCase();
    
    // An edge is an 'output' if it comes FROM the target address
    // We check: 
    // 1. The node's raw address matches target
    // 2. The ID matches mainAddressId
    // 3. The ID contains the target address
    // 4. The node data explicitly says it's target (if we added that info)
    const isOutput = fromAddress.includes(targetAddressRaw) || 
                     item.from.toLowerCase() === mainAddressId.toLowerCase() ||
                     item.from.toLowerCase().includes(targetAddressRaw) ||
                     (fromNode && fromNode.isTarget);
    
    const themeColor = isOutput ? '#00A54C' : '#7262FD';
    const amountLabel = codeHTMLEntities(item.data?.description || '');
    const serial = item.data?.step || (parseInt(item.id.split('-')[1] || '0') + 1);

    dot += `  "${item.from}" -> "${item.to}" [
      id="${item.id}"
      color="${themeColor}"
      penwidth="2.1"
      label=<<table border="0" cellborder="0" cellspacing="0" bgcolor="#16181D">
        <tr>
          <td align="center" cellpadding="4"><font color="${themeColor}" point-size="11" face="Inter,Poppins-Regular">[${serial}]</font></td>
          <td align="center" cellpadding="4"><font color="#FFFFFF" point-size="11" face="Inter,Poppins-Regular">${amountLabel}</font></td>
        </tr>
      </table>>
    ]\n`;
  });

  dot += '}';
  return dot;
};

/**
 * Uses d3-graphviz to compute positions and edge paths from a DOT string
 */
export const computeMetaSleuthPositions = async (dot: string): Promise<{
  nodes: Record<string, { x: number, y: number }>;
  edges: Record<string, { path: string, label?: { x: number, y: number } }>;
}> => {
  return new Promise((resolve, reject) => {
    // We need a hidden div to render into
    let container = document.getElementById('graphviz-temp');
    if (!container) {
      container = document.createElement('div');
      container.id = 'graphviz-temp';
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    const gv = graphviz('#graphviz-temp', { useWorker: false });
    
    gv.renderDot(dot)
      .on('end', () => {
        const nodePositions: Record<string, { x: number, y: number }> = {};
        const edgePaths: Record<string, { path: string, label?: { x: number, y: number } }> = {};
        
        // 1. Extract Node Positions
        d3.selectAll('#graphviz-temp svg .node').each(function() {
          const node = d3.select(this);
          const id = node.select('title').text().trim();
          const transform = node.attr('transform');
          if (transform) {
            const match = /translate\(([^, ]+)[, ]+([^)]+)\)/.exec(transform);
            if (match) {
              nodePositions[id] = {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
              };
            }
          }
        });

        // 2. Extract Edge Paths (Splines) using ID
        d3.selectAll('#graphviz-temp svg .edge').each(function() {
          const edge = d3.select(this);
          const edgeId = edge.attr('id');
          const path = edge.select('path').attr('d');
          
          if (edgeId && path) {
            // Extract label position if it exists (usually a <text> in the edge)
            let labelPos: { x: number, y: number } | undefined;
            const text = edge.select('text');
            if (!text.empty()) {
              labelPos = {
                x: parseFloat(text.attr('x') || '0'),
                y: parseFloat(text.attr('y') || '0')
              };
            }

            edgePaths[edgeId] = { path, label: labelPos };
          }
        });

        resolve({ nodes: nodePositions, edges: edgePaths });
      })
      .on('error', ((err: any) => {
        reject(err);
      }) as any);
  });
};
