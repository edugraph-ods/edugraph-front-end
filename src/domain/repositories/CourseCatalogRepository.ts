import type { Course } from "@/domain/entities/course";

export interface CourseCatalogRepository {
  listCourses(): Promise<Course[]>;
}
