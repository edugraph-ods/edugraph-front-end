import { useCallback, useEffect, useMemo, useState } from 'react';
import { Node, Edge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import type { Course, CourseStatus } from '@/domain/entities/course';
import type { CourseGraphEdge, CourseGraphNode } from '@/domain/entities/coursePlan';
import { createBuildCourseGraph } from '@/application/useCases/coursePlan/createBuildCourseGraph';

export interface CourseNodeData {
  label: string;
  status: CourseStatus;
  credits: number;
  cycle: number;
  prerequisites: string[];
  isCritical?: boolean;
  isInCriticalPath?: boolean;
}

export type CourseNode = Node<CourseNodeData> & {
  id: string;
  x: number;
  y: number;
  data: CourseNodeData;
  status?: CourseStatus;
};

type ReactCourseEdge = Edge & {
  isCritical?: boolean;
};

const mapNodesToReactFlow = (nodes: CourseGraphNode[]): CourseNode[] =>
  nodes.map((node) => ({
    id: node.id,
    type: 'courseNode',
    data: {
      label: node.label,
      status: node.status,
      credits: node.credits,
      cycle: node.cycle,
      prerequisites: node.prerequisites,
      isCritical: node.isCritical,
      isInCriticalPath: node.isInCriticalPath,
    },
    position: node.position,
    x: node.position.x,
    y: node.position.y,
  }));

const mapEdgesToReactFlow = (edges: CourseGraphEdge[]): ReactCourseEdge[] =>
  edges.map((edge) => {
    const isCritical = edge.isCritical;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: isCritical,
      isCritical,
      style: {
        stroke: isCritical ? '#f59e0b' : '#3b82f6',
        strokeWidth: isCritical ? 3 : 2,
        strokeDasharray: '0',
        opacity: 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isCritical ? '#f59e0b' : '#3b82f6',
        width: 16,
        height: 16,
        strokeWidth: 1.5,
      },
      zIndex: isCritical ? 10 : 5,
    } satisfies ReactCourseEdge;
  });

export const useCourseGraph = (courses: Course[] = []) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CourseNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const buildCourseGraph = useMemo(() => createBuildCourseGraph(), []);

  const hydrateGraph = useCallback(
    (result: { nodes: CourseGraphNode[]; edges: CourseGraphEdge[]; criticalPath: string[] }) => {
      const reactNodes = mapNodesToReactFlow(result.nodes);
      const reactEdges = mapEdgesToReactFlow(result.edges);

      setNodes(reactNodes);
      setEdges(reactEdges);
      setCriticalPath(result.criticalPath);
    },
    [setEdges, setNodes]
  );

  useEffect(() => {
    if (!courses.length) {
      setNodes([]);
      setEdges([]);
      setCriticalPath([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = buildCourseGraph(courses);
      hydrateGraph(result);
    } catch (error) {
      console.error('Error building course graph:', error);
    } finally {
      setIsLoading(false);
    }
  }, [buildCourseGraph, courses, hydrateGraph, setEdges, setNodes]);

  return {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    criticalPath,
    setEdges,
    setNodes
  };
};