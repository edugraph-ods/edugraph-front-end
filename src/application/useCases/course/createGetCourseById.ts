import type { CourseDetail } from "@/domain/entities/courseDetail";
import type { CourseRepository } from "@/domain/repositories/CourseRepository";

export const createGetCourseById = (repo: CourseRepository) => {
  return async (id: string): Promise<CourseDetail> => {
    return repo.getById(id);
  };
};
