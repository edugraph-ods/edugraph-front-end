export type CourseStatus = "approved" | "failed" | "not_taken";

export interface Course {
  id: string;
  name: string;
  credits: number;
  cycle: number;
  prerequisites: string[];
  status: CourseStatus;
  career?: string;
  university?: string;
  program?: string;
  isInStudyPlan?: boolean;
  isCritical?: boolean;
  isInCriticalPath?: boolean;
}
