import type { Course } from "@/domain/entities/course";
import type { CourseCatalogRepository } from "@/domain/repositories/CourseCatalogRepository";

export type ListCourses = () => Promise<Course[]>;

export const createListCourses = (
  repository: CourseCatalogRepository
): ListCourses => {
  return async () => repository.listCourses();
};
