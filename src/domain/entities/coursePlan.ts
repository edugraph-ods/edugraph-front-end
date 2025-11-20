import type { CourseStatus } from "@/domain/entities/course";

export interface CourseGraphNode {
  id: string;
  label: string;
  status: CourseStatus;
  credits: number;
  cycle: number;
  prerequisites: string[];
  position: {
    x: number;
    y: number;
  };
  isCritical: boolean;
  isInCriticalPath: boolean;
}

export interface CourseGraphEdge {
  id: string;
  source: string;
  target: string;
  isCritical: boolean;
}

export interface CourseGraphResult {
  nodes: CourseGraphNode[];
  edges: CourseGraphEdge[];
  criticalPath: string[];
}
