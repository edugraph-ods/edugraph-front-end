// src/hooks/useCourseGraph.ts
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

  const scheduler = useMemo(() => new OptimizedCourseScheduler(courses, 7), [courses]);

  const generateNodePositions = useCallback((courses: Course[]): { [key: string]: { x: number; y: number } } => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const levelMap = new Map<string, number>();
    const processed = new Set<string>();

    const calculateLevel = (courseId: string): number => {
      if (levelMap.has(courseId)) return levelMap.get(courseId)!;
      if (processed.has(courseId)) return 0;

      processed.add(courseId);
      const course = courses.find(c => c.id === courseId);
      if (!course) return 0;

      if (!course.prerequisites || course.prerequisites.length === 0) {
        levelMap.set(courseId, 0);
        return 0;
      }

      const prereqLevels = course.prerequisites.map(prereqId => calculateLevel(prereqId) + 1);
      const level = Math.max(...prereqLevels);
      levelMap.set(courseId, level);
      return level;
    };

    courses.forEach(course => calculateLevel(course.id));

    const levels = new Map<number, string[]>();
    courses.forEach(course => {
      const level = levelMap.get(course.id) || 0;
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level)!.push(course.id);
    });

    const xGap = 250;
    const yGap = 120;
    const padding = 100;
    const maxNodesInLevel = Math.max(...Array.from(levels.values()).map(level => level.length));

    levels.forEach((courseIds, level) => {
      const levelWidth = (maxNodesInLevel - 1) * xGap + 2 * padding;
      const startX = (typeof window !== 'undefined' ? window.innerWidth : 1200) - levelWidth > 0
        ? (window.innerWidth - levelWidth) / 2
        : padding;
      const x = startX + level * xGap;

      const levelHeight = (courseIds.length - 1) * yGap + 2 * padding;
      const startY = (typeof window !== 'undefined' ? window.innerHeight : 800) - levelHeight > 0
        ? (window.innerHeight - levelHeight) / 2
        : padding / 2;

      courseIds.sort((a, b) => {
        const aOutgoing = courses.filter(c => c.prerequisites.includes(a)).length;
        const bOutgoing = courses.filter(c => c.prerequisites.includes(b)).length;
        return bOutgoing - aOutgoing;
      });

      courseIds.forEach((courseId, index) => {
        const y = startY + index * yGap;
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
      setCriticalPath(cp);
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