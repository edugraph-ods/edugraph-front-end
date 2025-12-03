import type { Career } from "@/features/education/careers/domain/entities/career";
import type { Course } from "@/features/education/courses/domain/entities/course";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/features/education/academic_progress/domain/entities/progress";

export interface CareerRepository {
  listCareers(): Promise<Career[]>;
  listCoursesByCareer(careerId: string): Promise<Course[]>;
  calculateAcademicProgress(
    careerId: string,
    payload: AcademicProgressRequest
  ): Promise<AcademicProgressResponse>;
  getMinPrerequisites(
    careerId: string,
    courseId: string
  ): Promise<{
    course_id: string;
    min_courses_required: number;
    courses_in_order: Array<{ id: string; name: string; code: string }>;
  }>;
  getPersonalizedProgress(
    careerId: string,
    payload: AcademicProgressRequest
  ): Promise<Array<{ course_id: string; name: string; cycle: number; distance: number }>>;
}
