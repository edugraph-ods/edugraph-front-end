import type { CareerRepository } from "@/domain/repositories/CareerRepository";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/domain/entities/progress";

export const createCalculateAcademicProgress = (repo: CareerRepository) => {
  return async (
    careerId: string,
    payload: AcademicProgressRequest
  ): Promise<AcademicProgressResponse> => {
    return repo.calculateAcademicProgress(careerId, payload);
  };
};
