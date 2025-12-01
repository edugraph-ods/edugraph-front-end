import type { CourseStatus } from "@/features/education/courses/domain/entities/course";

export interface DashboardState {
  statuses: Record<string, CourseStatus>;
  plannedCourseIds: string[];
  selectedCareer: string | null;
  creditLimit: number | null;
}
