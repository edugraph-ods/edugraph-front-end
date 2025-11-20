import type { Course } from "@/domain/entities/course";
import type { CareerRepository } from "@/domain/repositories/CareerRepository";

export const createListCoursesByCareer = (repo: CareerRepository) => {
  return async (careerId: string): Promise<Course[]> => {
    if (!careerId) return [];
    const courses = await repo.listCoursesByCareer(careerId);
    return courses;
  };
};
