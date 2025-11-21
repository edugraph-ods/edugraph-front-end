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
}
