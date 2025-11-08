import type { CourseStatus } from "@/domain/entities/course";

export interface DashboardState {
  statuses: Record<string, CourseStatus>;
  plannedCourseIds: string[];
  selectedCareer: string | null;
  creditLimit: number | null;
}
