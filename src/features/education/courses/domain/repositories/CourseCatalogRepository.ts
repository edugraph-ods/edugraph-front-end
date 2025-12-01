import type { Course } from "@/features/education/courses/domain/entities/course";

export interface CourseCatalogRepository {
  listCourses(): Promise<Course[]>;
}
