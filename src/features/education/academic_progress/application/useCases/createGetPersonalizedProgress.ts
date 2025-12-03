import type { CareerRepository } from "@/features/education/careers/domain/repositories/CareerRepository";
import type { AcademicProgressRequest } from "@/features/education/academic_progress/domain/entities/progress";

export const createGetPersonalizedProgress = (repo: CareerRepository) => {
  return async (
    careerId: string,
    payload: AcademicProgressRequest
  ): Promise<Array<{ course_id: string; name: string; cycle: number; distance: number }>> => {
    return repo.getPersonalizedProgress(careerId, payload);
  };
};
