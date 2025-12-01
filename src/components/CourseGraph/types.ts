import type { Course } from "@/features/education/courses/domain/entities/course";
import type { PlanResult } from "@/features/shared/domain/entities/graph";

export type CourseStatus = "not_taken" | "approved" | "failed";

export interface CourseGraphProps {
  courses: Course[];
  displayCourses?: Course[];
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onCourseSelect?: (courseId: string) => void;
  planResult?: PlanResult | null;
}
