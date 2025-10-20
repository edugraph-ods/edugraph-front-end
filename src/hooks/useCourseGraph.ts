import { useCallback, useEffect, useMemo, useState } from 'react';
import { Node, Edge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import { COURSES, Course, CourseStatus } from './use-course';
import { OptimizedCourseScheduler } from '../utils/courseScheduler';

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

export const useCourseGraph = (courses: Course[] = []) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CourseNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const coursesKey = useMemo(() => {
    return courses
      .map((course) => {
        const prereqs = (course.prerequisites || []).join(',');
        return `${course.id}|${course.status}|${course.credits}|${course.cycle}|${prereqs}`;
      })
      .join(';');
  }, [courses]);

  const scheduler = useMemo(() => new OptimizedCourseScheduler(courses, 7), [coursesKey]);

  const generateNodePositions = useCallback((courses: Course[]): { [key: string]: { x: number; y: number } } => {
    const positions: { [key: string]: { x: number; y: number } } = {};

    const cycles = Array.from(new Set(courses.map(c => c.cycle))).sort((a, b) => a - b);
    const byCycle = new Map<number, string[]>();
    courses.forEach(c => {
      const arr = byCycle.get(c.cycle) ?? [];
      arr.push(c.id);
      byCycle.set(c.cycle, arr);
    });

    const xGap = 320;
    const yGap = 110;
    const paddingX = 80;
    const paddingY = 60;

    const maxPerCycle = Math.max(...cycles.map(cyc => (byCycle.get(cyc)?.length ?? 0)));    
    const columnHeight = (maxPerCycle - 1) * yGap + 2 * paddingY;

    const viewW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const startYBase = viewH - columnHeight > 0 ? (viewH - columnHeight) / 2 : paddingY;

    cycles.forEach((cycle, colIndex) => {
      const ids = (byCycle.get(cycle) ?? []).slice();
      ids.sort((a, b) => {
        const aOut = courses.filter(c => c.prerequisites.includes(a)).length;
        const bOut = courses.filter(c => c.prerequisites.includes(b)).length;
        return bOut - aOut;
      });

      const x = paddingX + colIndex * xGap;
      const levelHeight = (ids.length - 1) * yGap + 2 * paddingY;
      const startY = viewH - levelHeight > 0 ? (viewH - levelHeight) / 2 : startYBase;

      ids.forEach((courseId, rowIndex) => {
        const y = startY + rowIndex * yGap;
        positions[courseId] = { x, y };
      });
    });

    return positions;
  }, []);

  const generateEdges = useCallback((nodes: CourseNode[], criticalPath: string[] = []): Edge[] => {
    const edges: Edge[] = [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    nodes.forEach(node => {
      const targetId = node.id;
      node.data.prerequisites?.forEach(sourceId => {
        if (!nodeMap.has(sourceId)) return;
        const isCriticalEdge = criticalPath.includes(sourceId) &&
          criticalPath.includes(targetId) &&
          (criticalPath.indexOf(sourceId) + 1 === criticalPath.indexOf(targetId));
        const edgeId = `${sourceId}-${targetId}`;
        
        if (edges.some(e => e.id === edgeId)) return;

        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          animated: isCriticalEdge,
          style: {
            stroke: isCriticalEdge ? '#f59e0b' : '#3b82f6',
            strokeWidth: isCriticalEdge ? 3 : 2,
            strokeDasharray: '0',
            opacity: 1
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? '#f59e0b' : '#3b82f6',
            width: 16,
            height: 16,
            strokeWidth: 1.5
          },
          zIndex: isCriticalEdge ? 10 : 5
        });
      });
    });

    return edges;
  }, []);

  const updateCourseStatus = useCallback((courseId: string, newStatus: CourseStatus) => {
    try {
      const courseIndex = COURSES.findIndex(c => c.id === courseId);
      if (courseIndex !== -1) {
        COURSES[courseIndex].status = newStatus;
        const cp = scheduler.getCriticalPath();
        setCriticalPath(cp);

        setNodes(prevNodes => 
          prevNodes.map(node => ({
            ...node,
            data: { 
              ...node.data,
              status: node.id === courseId ? newStatus : node.data.status,
              isCritical: cp.includes(node.id),
              isInCriticalPath: cp.includes(node.id)
            }
          }))
        );
      }
    } catch (error) {
      console.error('Error updating course status:', error);
    }
  }, [scheduler, setNodes]);

  useEffect(() => {
    try {
      const cp = scheduler.getCriticalPath();
      setCriticalPath((prev) => {
        if (prev.length === cp.length && prev.every((value, index) => value === cp[index])) {
          return prev;
        }
        return cp;
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating critical path:', error);
      setIsLoading(false);
    }
  }, [scheduler]);

  const courseNodes = useMemo(() => {
    if (!courses.length) return [];
    const positions = generateNodePositions(courses);
    return courses.map(course => ({
      id: course.id,
      type: 'courseNode',
      data: {
        label: course.name,
        status: course.status || 'not_taken',
        credits: course.credits,
        cycle: course.cycle,
        prerequisites: course.prerequisites || [],
        isCritical: false,
        isInCriticalPath: false
      },
      position: positions[course.id] || { x: 0, y: 0 },
      x: positions[course.id]?.x || 0,
      y: positions[course.id]?.y || 0
    }));
  }, [generateNodePositions, courses]);

  useEffect(() => {
    if (!courseNodes.length) return;

    const updatedNodes = courseNodes.map(node => ({
      ...node,
      data: { 
        ...node.data, 
        isCritical: criticalPath.includes(node.id), 
        isInCriticalPath: criticalPath.includes(node.id) 
      }
    }));

    setNodes(updatedNodes);
    setEdges(generateEdges(updatedNodes, criticalPath));
  }, [courseNodes, criticalPath, setNodes, setEdges, generateEdges]);

  return {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    updateCourseStatus,
    criticalPath,
    setEdges,
    setNodes
  };
};