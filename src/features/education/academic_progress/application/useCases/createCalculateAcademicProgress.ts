import type { CareerRepository } from "@/features/education/careers/domain/repositories/CareerRepository";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/features/education/academic_progress/domain/entities/progress";

export const createCalculateAcademicProgress = (repo: CareerRepository) => {
  return async (
    careerId: string,
    payload: AcademicProgressRequest
  ): Promise<AcademicProgressResponse> => {
    return repo.calculateAcademicProgress(careerId, payload);
  };
};
