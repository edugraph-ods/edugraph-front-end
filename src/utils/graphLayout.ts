import { Node, Edge, Position } from 'reactflow';
import dagre from 'dagre';
import { CourseNodeData } from '../hooks/useCourseGraph';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;

type LayoutNode = Node<CourseNodeData> & {
  targetPosition?: Position;
  sourcePosition?: Position;
};

export const getLayoutedElements = (nodes: LayoutNode[], edges: Edge[], direction = 'TB'): LayoutNode[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 100,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    if (edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
};
