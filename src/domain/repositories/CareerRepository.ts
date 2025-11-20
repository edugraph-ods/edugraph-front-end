import type { Career } from "@/domain/entities/career";
import type { Course } from "@/domain/entities/course";

export interface CareerRepository {
  listCareers(): Promise<Career[]>;
  listCoursesByCareer(careerId: string): Promise<Course[]>;
}
