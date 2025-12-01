import type { CourseDetail } from "@/features/education/courses/domain/entities/courseDetail";
import type { CourseRepository } from "@/features/education/courses/domain/repositories/CourseRepository";

export const createGetCourseById = (repo: CourseRepository) => {
  return async (id: string): Promise<CourseDetail> => {
    return repo.getById(id);
  };
};
