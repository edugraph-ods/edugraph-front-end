import type { Course } from "@/features/education/courses/domain/entities/course";
import type { CourseCatalogRepository } from "@/features/education/courses/domain/repositories/CourseCatalogRepository";

export type ListCourses = () => Promise<Course[]>;

export const createListCourses = (
  repository: CourseCatalogRepository
): ListCourses => {
  return async () => repository.listCourses();
};
