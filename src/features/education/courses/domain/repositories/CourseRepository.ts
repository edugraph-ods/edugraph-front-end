import type { CourseDetail } from "../../domain/entities/courseDetail";

export interface CourseRepository {
  getById(id: string): Promise<CourseDetail>;
}
