import type { CourseStatus } from "@/domain/entities/course";

export type StudyPlanCourseStatus = "NOT_STARTED" | "PASSED" | "FAILED";

export interface StudyPlanCourse {
  course_id: string;
  status: StudyPlanCourseStatus;
  prerequisites: string[];
}

export interface StudyPlanCycle {
  cycle_number: number;
  courses: StudyPlanCourse[];
}

export interface CreateStudyPlanRequest {
  name: string;
  max_credits: number;
  career_id: string;
  cycles: StudyPlanCycle[];
}

export interface CreateStudyPlanResponse {
  message: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

export interface StudyPlanSummary {
  plan_id: string;
  name: string;
}

export interface ListStudyPlansResponse {
  study_plans: StudyPlanSummary[];
}

export interface StudyPlanDetailCourse {
  course_id: string;
  name: string;
  credits: number;
  status: StudyPlanCourseStatus;
  prerequisites: string[];
}

export interface StudyPlanDetailCycle {
  cycle_number: number;
  courses: StudyPlanDetailCourse[];
}

export interface StudyPlanDetailResponse {
  plan_id: string;
  name: string;
  max_credits: number;
  career_id: string;
  cycles: StudyPlanDetailCycle[];
}

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
