const fs = require('fs');
const dagre = require('dagre');

const dataStr = fs.readFileSync('payload.json', 'utf8');
const data = JSON.parse(dataStr);

const dataNodes = data.data.nodes;
const dataEdges = data.data.edges;

const rawEdges = dataEdges.filter((edge) => edge.selected === true || edge.data?.selected === true);
const activeNodeIds = new Set();
rawEdges.forEach(edge => {
    activeNodeIds.add(edge.from);
    activeNodeIds.add(edge.to);
});

const rawNodes = dataNodes.filter(node => activeNodeIds.has(node.id.toLowerCase()) || node.id.toLowerCase().includes('0x35719a588d312ed78e56e1bafa02ff690a861046'));

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
dagreGraph.setGraph({});

rawNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 40 });
});

rawEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to, { weight: 1 });
});

dagre.layout(dagreGraph);

const layoutedNodes = rawNodes.map((node) => {
    const n = dagreGraph.node(node.id);
    return n;
});

console.log("Dagre Graph Layout computed nodes count: ", layoutedNodes.filter(n => n !== undefined).length);
