import type { Career } from "@/domain/entities/career";
import type { Course } from "@/domain/entities/course";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/domain/entities/progress";

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
}
