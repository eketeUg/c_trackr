import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 380;
const NODE_HEIGHT = 100;

export const sortEdgesMetaSleuth = (edges: Edge[]) => {
  const groupMap = edges.reduce((acc: Record<string, Edge[]>, item) => {
    const key = `${item.source}-${item.target}`;
    const keyReverse = `${item.target}-${item.source}`;
    if (acc[key]) {
      acc[key].push(item);
    } else if (acc[keyReverse]) {
      acc[keyReverse].push(item);
    } else {
      acc[key] = [item];
    }
    return acc;
  }, {});

  const result: Edge[] = [];
  for (const key in groupMap) {
    const arr = [...groupMap[key]];
    const [from, to] = key.split('-');
    
    // Check how many edges go from 'from' to 'to' directly (the key orientation)
    const temp = arr.filter((item) => item.source === from && item.target === to);
    
    // If fewer than half the edges go in the 'key' direction, it means the dominant flow is reverse
    if (temp.length < Math.ceil(arr.length / 2)) {
      const sourceIdx = arr.findIndex(
        (item) => item.target === from && item.source === to
      );
      
      // Swap the first dominant edge to the front of the array. Dagre builds its hierarchy rank based on the first edge seen.
      if (sourceIdx !== -1) {
        const item = arr[sourceIdx];
        arr.splice(sourceIdx, 1);
        arr.unshift(item);
      }
    }
    result.push(...arr);
  }
  return result;
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 40,   // Vertical space between nodes in the same rank
    ranksep: 280,  // Horizontal space between ranks (spreads out the graph wide)
    edgesep: 20
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, { 
       weight: 1 
    });
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };
    
    newNode.position = {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};
